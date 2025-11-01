import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import Order from '@/models/Order';
import User from '@/models/User';

// GET: ดึงข้อมูล mapping และสถิติ
export async function GET(request: NextRequest) {
  try {
    console.log('[API] Starting order mapping GET request');
    
    await connectToDatabase();
    console.log('[API] Database connected successfully');
    
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    
    console.log('[API] Action requested:', action);
    
    if (action === 'stats') {
      // ดึงสถิติการ mapping
      const totalOrders = await Order.countDocuments();
      const mappedOrders = await Order.countDocuments({ userId: { $exists: true, $ne: null } });
      const unmappedOrders = totalOrders - mappedOrders;
      
      console.log('[API] Stats calculated:', { totalOrders, mappedOrders, unmappedOrders });
      
      return NextResponse.json({
        success: true,
        data: {
          totalOrders,
          mappedOrders,
          unmappedOrders,
          mappingRate: totalOrders > 0 ? ((mappedOrders / totalOrders) * 100).toFixed(2) : 0
        }
      });
    }
    
    if (action === 'unmapped') {
      // ดึงรายการออเดอร์ที่ยังไม่ได้ mapping
      const unmappedOrders = await Order.find({
        $or: [
          { userId: { $exists: false } },
          { userId: null }
        ]
      })
      .select('_id customerName customerPhone totalAmount createdAt status')
      .sort({ createdAt: -1 })
      .limit(50);
      
      console.log('[API] Found unmapped orders:', unmappedOrders.length);
      
      return NextResponse.json({
        success: true,
        data: unmappedOrders
      });
    }
    
    return NextResponse.json({ success: true, message: 'API endpoint สำหรับ order mapping' });
    
  } catch (error) {
    console.error('[API] Error in order mapping GET API:', error);
    
    // ส่ง error response ที่มีรายละเอียดมากขึ้น
    if (error instanceof Error) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'เกิดข้อผิดพลาดในการดึงข้อมูล',
          details: error.message,
          stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { success: false, error: 'เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ' },
      { status: 500 }
    );
  }
}

// POST: ทำการ auto mapping หรือ manual mapping
export async function POST(request: NextRequest) {
  try {
    console.log('[API] Starting order mapping POST request');
    
    await connectToDatabase();
    console.log('[API] Database connected successfully');
    
    const body = await request.json();
    const { action, orderId, userId, phoneNumber } = body;
    
    console.log('[API] Action requested:', action, { orderId, userId, phoneNumber });
    
    if (action === 'auto-map') {
      // Auto mapping ตามเบอร์โทรศัพท์
      const result = await autoMapOrdersByPhone();
      console.log('[API] Auto mapping completed:', result);
      
      return NextResponse.json({
        success: true,
        data: result
      });
    }
    
    if (action === 'manual-map') {
      if (!orderId || !userId) {
        return NextResponse.json(
          { success: false, error: 'ต้องระบุ orderId และ userId' },
          { status: 400 }
        );
      }
      
      // Manual mapping ออเดอร์กับผู้ใช้
      const updatedOrder = await Order.findByIdAndUpdate(
        orderId,
        { userId },
        { new: true }
      );
      
      if (!updatedOrder) {
        return NextResponse.json(
          { success: false, error: 'ไม่พบออเดอร์ที่ระบุ' },
          { status: 404 }
        );
      }
      
      // อัปเดตสถิติของผู้ใช้
      await updateUserStats(userId);
      
      console.log('[API] Manual mapping completed for order:', orderId);
      
      return NextResponse.json({
        success: true,
        data: updatedOrder
      });
    }
    
    if (action === 'batch-sync') {
      // ซิงค์ข้อมูลเก่าทั้งหมด
      const result = await batchSyncOrders();
      console.log('[API] Batch sync completed:', result);
      
      return NextResponse.json({
        success: true,
        data: result
      });
    }
    
    return NextResponse.json(
      { success: false, error: 'ไม่ระบุ action ที่ถูกต้อง' },
      { status: 400 }
    );
    
  } catch (error) {
    console.error('[API] Error in order mapping POST API:', error);
    
    // ส่ง error response ที่มีรายละเอียดมากขึ้น
    if (error instanceof Error) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'เกิดข้อผิดพลาดในการประมวลผล',
          details: error.message,
          stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { success: false, error: 'เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ' },
      { status: 500 }
    );
  }
}

// ฟังก์ชัน Auto mapping ตามเบอร์โทรศัพท์
async function autoMapOrdersByPhone() {
  console.log('[API] Starting auto mapping by phone');
  
  const unmappedOrders = await Order.find({
    $or: [
      { userId: { $exists: false } },
      { userId: null }
    ]
  });
  
  console.log('[API] Found unmapped orders for auto mapping:', unmappedOrders.length);
  
  let successCount = 0;
  let errorCount = 0;
  const errors: string[] = [];
  
  for (const order of unmappedOrders) {
    try {
      // ค้นหาผู้ใช้ตามเบอร์โทรศัพท์
      const user = await User.findOne({ 
        phoneNumber: order.customerPhone 
      });
      
      if (user) {
        await Order.findByIdAndUpdate(order._id, { userId: user._id });
        successCount++;
        console.log(`[API] Successfully mapped order ${order._id} to user ${user._id}`);
      } else {
        errorCount++;
        errors.push(`ไม่พบผู้ใช้สำหรับเบอร์ ${order.customerPhone} (ออเดอร์: ${order._id})`);
      }
    } catch (error) {
      errorCount++;
      const errorMsg = `เกิดข้อผิดพลาดในการ mapping ออเดอร์ ${order._id}: ${error}`;
      errors.push(errorMsg);
      console.error('[API]', errorMsg);
    }
  }
  
  console.log('[API] Auto mapping completed:', { successCount, errorCount });
  
  return {
    totalProcessed: unmappedOrders.length,
    successCount,
    errorCount,
    errors
  };
}

// ฟังก์ชัน Batch sync ข้อมูลเก่า
async function batchSyncOrders() {
  console.log('[API] Starting batch sync');
  
  const allOrders = await Order.find({});
  console.log('[API] Total orders to process:', allOrders.length);
  
  let successCount = 0;
  let errorCount = 0;
  const errors: string[] = [];
  const userStats: { [key: string]: { totalOrders: number; totalSpent: number } } = {};
  
  for (const order of allOrders) {
    try {
      // ค้นหาผู้ใช้ตามเบอร์โทรศัพท์
      const user = await User.findOne({ 
        phoneNumber: order.customerPhone 
      });
      
      if (user) {
        // อัปเดต userId ในออเดอร์
        await Order.findByIdAndUpdate(order._id, { userId: user._id });
        
        // รวบรวมสถิติ
        if (!userStats[user._id.toString()]) {
          userStats[user._id.toString()] = { totalOrders: 0, totalSpent: 0 };
        }
        userStats[user._id.toString()].totalOrders++;
        userStats[user._id.toString()].totalSpent += order.totalAmount;
        
        successCount++;
      } else {
        errorCount++;
        errors.push(`ไม่พบผู้ใช้สำหรับเบอร์ ${order.customerPhone} (ออเดอร์: ${order._id})`);
      }
    } catch (error) {
      errorCount++;
      const errorMsg = `เกิดข้อผิดพลาดในการ sync ออเดอร์ ${order._id}: ${error}`;
      errors.push(errorMsg);
      console.error('[API]', errorMsg);
    }
  }
  
  // อัปเดตสถิติของผู้ใช้ทั้งหมด
  console.log('[API] Updating user stats for', Object.keys(userStats).length, 'users');
  
  for (const [userId, stats] of Object.entries(userStats)) {
    try {
      await User.findByIdAndUpdate(userId, {
        totalOrders: stats.totalOrders,
        totalSpent: stats.totalSpent,
        averageOrderValue: stats.totalSpent / stats.totalOrders,
        lastOrderDate: new Date()
      });
    } catch (error) {
      const errorMsg = `เกิดข้อผิดพลาดในการอัปเดตสถิติผู้ใช้ ${userId}: ${error}`;
      errors.push(errorMsg);
      console.error('[API]', errorMsg);
    }
  }
  
  console.log('[API] Batch sync completed:', { successCount, errorCount });
  
  return {
    totalProcessed: allOrders.length,
    successCount,
    errorCount,
    errors
  };
}

// ฟังก์ชันอัปเดตสถิติของผู้ใช้
async function updateUserStats(userId: string) {
  try {
    console.log('[API] Updating stats for user:', userId);
    
    const userOrders = await Order.find({ userId });
    
    if (userOrders.length > 0) {
      const totalOrders = userOrders.length;
      const totalSpent = userOrders.reduce((sum, order) => sum + order.totalAmount, 0);
      const averageOrderValue = totalSpent / totalOrders;
      const lastOrderDate = new Date(Math.max(...userOrders.map(o => new Date(o.createdAt).getTime())));
      
      await User.findByIdAndUpdate(userId, {
        totalOrders,
        totalSpent,
        averageOrderValue,
        lastOrderDate
      });
      
      console.log('[API] User stats updated successfully');
    }
  } catch (error) {
    console.error('[API] Error updating user stats:', error);
    throw error;
  }
}
