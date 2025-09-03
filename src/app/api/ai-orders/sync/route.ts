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
    
    // ดึงข้อมูล MessengerUser ทั้งหมดที่มีประวัติการสนทนา
    const messengerUsers = await MessengerUser.find({
      'conversationHistory.0': { $exists: true },
      updatedAt: { $gte: startDate }
    }).lean();
    
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
              
              // ตรวจสอบว่ามี AIOrder นี้อยู่แล้วหรือไม่
              const existingOrder = await AIOrder.findOne({
                psid: user.psid,
                userMessage: msg.content.substring(0, 100) // ใช้ส่วนแรกของข้อความเป็น key
              });
              
              if (!existingOrder) {
                // สร้าง AIOrder ใหม่
                const aiOrder = new AIOrder({
                  psid: user.psid,
                  order_status: orderData.order_status || 'draft',
                  items: orderData.items || [],
                  pricing: orderData.pricing || {
                    currency: 'THB',
                    subtotal: 0,
                    discount: 0,
                    shipping_fee: 0,
                    total: 0
                  },
                  customer: orderData.customer || {
                    name: null,
                    phone: null,
                    address: null
                  },
                  errorMessages: orderData.errors || [],
                  aiResponse: msg.content,
                  userMessage: msg.content.substring(0, 200) // เก็บส่วนแรกของข้อความ
                });
                
                await aiOrder.save();
                newOrders++;
                console.log(`[AI Orders Sync] Created new order for PSID: ${user.psid}`);
              } else {
                // อัปเดต AIOrder ที่มีอยู่
                existingOrder.aiResponse = msg.content;
                existingOrder.order_status = orderData.order_status || existingOrder.order_status;
                existingOrder.items = orderData.items || existingOrder.items;
                existingOrder.pricing = orderData.pricing || existingOrder.pricing;
                existingOrder.customer = orderData.customer || existingOrder.customer;
                existingOrder.errorMessages = orderData.errors || existingOrder.errorMessages;
                
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
