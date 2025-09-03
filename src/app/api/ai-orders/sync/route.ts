import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import AIOrder from '@/models/AIOrder';
import MessengerUser from '@/models/MessengerUser';
import { extractOrderDataFromAIResponse } from '@/utils/openai-utils';

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    
    const body = await request.json();
    const { dateRange = 7, adminName = 'Admin' } = body;
    
    // คำนวณวันที่เริ่มต้น
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - dateRange);
    
    console.log(`[AI Orders Sync] Starting sync for ${dateRange} days from ${startDate.toISOString()}`);
    
    // First, let's check how many MessengerUsers exist in total
    const totalMessengerUsers = await MessengerUser.countDocuments();
    console.log(`[AI Orders Sync] Total MessengerUsers in database: ${totalMessengerUsers}`);
    
    // Check how many have conversation history
    const usersWithHistory = await MessengerUser.countDocuments({
      'conversationHistory.0': { $exists: true }
    });
    console.log(`[AI Orders Sync] MessengerUsers with conversation history: ${usersWithHistory}`);
    
    // Check how many have recent updates
    const recentUsers = await MessengerUser.countDocuments({
      updatedAt: { $gte: startDate }
    });
    console.log(`[AI Orders Sync] MessengerUsers updated since ${startDate.toISOString()}: ${recentUsers}`);

    // ดึงข้อมูล MessengerUser ทั้งหมดที่มีประวัติการสนทนา
    const messengerUsers = await MessengerUser.find({
      'conversationHistory.0': { $exists: true },
      updatedAt: { $gte: startDate }
    }).lean();
    
    console.log(`[AI Orders Sync] Found ${messengerUsers.length} MessengerUsers matching criteria`);
    
    // If no users found with date filter, try without date filter for debugging
    if (messengerUsers.length === 0) {
      console.log(`[AI Orders Sync] No users found with date filter, trying without date filter...`);
      const allUsersWithHistory = await MessengerUser.find({
        'conversationHistory.0': { $exists: true }
      }).limit(10).lean(); // Limit to first 10 for debugging
      
      console.log(`[AI Orders Sync] Found ${allUsersWithHistory.length} users with conversation history (ignoring date)`);
      
      if (allUsersWithHistory.length > 0) {
        console.log(`[AI Orders Sync] Sample user conversation history:`, {
          psid: allUsersWithHistory[0].psid,
          historyLength: allUsersWithHistory[0].conversationHistory?.length || 0,
          updatedAt: allUsersWithHistory[0].updatedAt,
          sampleMessage: allUsersWithHistory[0].conversationHistory?.[0]
        });
      }
    }
    
    let total = 0;
    let newOrders = 0;
    let updatedOrders = 0;
    let errors = 0;
    
    for (const user of messengerUsers) {
      const conversationHistory = user.conversationHistory || [];
      
      // กรองเฉพาะข้อความที่อยู่ในช่วงเวลาที่กำหนด
      const filteredHistory = conversationHistory.filter((msg: any) => {
        const msgDate = new Date(msg.timestamp || msg.createdAt || Date.now());
        return msgDate >= startDate;
      });
      
      // ตรวจสอบข้อความ AI ที่มีข้อมูลการสั่งซื้อ
      for (const msg of filteredHistory) {
        if (msg.role === 'assistant' && msg.content) {
          try {
            const orderData = extractOrderDataFromAIResponse(msg.content);
            
            if (orderData && orderData.items && orderData.items.length > 0) {
              total++;
              
              // Helper function to convert address object to string
              const formatAddress = (addressData: any): string | null => {
                if (!addressData) return null;
                if (typeof addressData === 'string') return addressData;
                if (typeof addressData === 'object') {
                  const { line1, district, province, postcode } = addressData;
                  const parts = [line1, district, province, postcode].filter(part => part && part !== 'null');
                  return parts.length > 0 ? parts.join(', ') : null;
                }
                return null;
              };
              
              // Helper function to ensure valid quantity
              const validateQuantity = (qty: any): number => {
                const parsedQty = parseInt(qty) || 0;
                return parsedQty < 1 ? 1 : parsedQty; // Default to 1 if invalid
              };
              
              // Transform and validate the order data
              const transformedOrderData = {
                ...orderData,
                items: orderData.items.map((item: any) => ({
                  ...item,
                  qty: validateQuantity(item.qty)
                })),
                customer: {
                  ...orderData.customer,
                  address: formatAddress(orderData.customer?.address)
                }
              };
              
              // ตรวจสอบว่ามี AIOrder นี้อยู่แล้วหรือไม่
              const existingOrder = await AIOrder.findOne({
                psid: user.psid,
                userMessage: msg.content.substring(0, 100) // ใช้ส่วนแรกของข้อความเป็น key
              });
              
              if (!existingOrder) {
                // สร้าง AIOrder ใหม่
                const aiOrder = new AIOrder({
                  psid: user.psid,
                  order_status: transformedOrderData.order_status || 'draft',
                  items: transformedOrderData.items || [],
                  pricing: transformedOrderData.pricing || {
                    currency: 'THB',
                    subtotal: 0,
                    discount: 0,
                    shipping_fee: 0,
                    total: 0
                  },
                  customer: transformedOrderData.customer || {
                    name: null,
                    phone: null,
                    address: null
                  },
                  errorMessages: transformedOrderData.errors || [],
                  aiResponse: msg.content,
                  userMessage: msg.content.substring(0, 200) // เก็บส่วนแรกของข้อความ
                });
                
                await aiOrder.save();
                newOrders++;
                console.log(`[AI Orders Sync] Created new order for PSID: ${user.psid}`);
              } else {
                // อัปเดต AIOrder ที่มีอยู่
                existingOrder.aiResponse = msg.content;
                existingOrder.order_status = transformedOrderData.order_status || existingOrder.order_status;
                existingOrder.items = transformedOrderData.items || existingOrder.items;
                existingOrder.pricing = transformedOrderData.pricing || existingOrder.pricing;
                existingOrder.customer = transformedOrderData.customer || existingOrder.customer;
                existingOrder.errorMessages = transformedOrderData.errors || existingOrder.errorMessages;
                
                await existingOrder.save();
                updatedOrders++;
                console.log(`[AI Orders Sync] Updated existing order for PSID: ${user.psid}`);
              }
            }
          } catch (error) {
            console.error(`[AI Orders Sync] Error processing message for PSID ${user.psid}:`, error);
            errors++;
          }
        }
      }
    }
    
    console.log(`[AI Orders Sync] Completed - Total: ${total}, New: ${newOrders}, Updated: ${updatedOrders}, Errors: ${errors}`);
    
    return NextResponse.json({
      success: true,
      data: {
        total,
        new: newOrders,
        updated: updatedOrders,
        errors,
        dateRange,
        adminName
      }
    });

  } catch (error) {
    console.error('[AI Orders Sync] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
