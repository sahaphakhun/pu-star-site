import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import Order from '@/models/Order';
import User from '@/models/User';

// GET: ดึงข้อมูล mapping และสถิติ
export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();
    
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    
    if (action === 'stats') {
      // ดึงสถิติการ mapping
      const totalOrders = await Order.countDocuments();
      const mappedOrders = await Order.countDocuments({ userId: { $exists: true, $ne: null } });
      const unmappedOrders = totalOrders - mappedOrders;
      
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
      
      return NextResponse.json({
        success: true,
        data: unmappedOrders
      });
    }
    
    return NextResponse.json({ success: true, message: 'API endpoint สำหรับ order mapping' });
    
  } catch (error) {
    console.error('Error in order mapping API:', error);
    return NextResponse.json(
      { success: false, error: 'เกิดข้อผิดพลาดในการดึงข้อมูล' },
      { status: 500 }
    );
  }
}

// POST: ทำการ auto mapping หรือ manual mapping
export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();
    
    const body = await request.json();
    const { action, orderId, userId, phoneNumber } = body;
    
    if (action === 'auto-map') {
      // Auto mapping ตามเบอร์โทรศัพท์
      const result = await autoMapOrdersByPhone();
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
      
      return NextResponse.json({
        success: true,
        data: updatedOrder
      });
    }
    
    if (action === 'batch-sync') {
      // ซิงค์ข้อมูลเก่าทั้งหมด
      const result = await batchSyncOrders();
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
    console.error('Error in order mapping API:', error);
    return NextResponse.json(
      { success: false, error: 'เกิดข้อผิดพลาดในการประมวลผล' },
      { status: 500 }
    );
  }
}

// ฟังก์ชัน Auto mapping ตามเบอร์โทรศัพท์
async function autoMapOrdersByPhone() {
  const unmappedOrders = await Order.find({
    $or: [
      { userId: { $exists: false } },
      { userId: null }
    ]
  });
  
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
      } else {
        errorCount++;
        errors.push(`ไม่พบผู้ใช้สำหรับเบอร์ ${order.customerPhone} (ออเดอร์: ${order._id})`);
      }
    } catch (error) {
      errorCount++;
      errors.push(`เกิดข้อผิดพลาดในการ mapping ออเดอร์ ${order._id}: ${error}`);
    }
  }
  
  return {
    totalProcessed: unmappedOrders.length,
    successCount,
    errorCount,
    errors
  };
}

// ฟังก์ชัน Batch sync ข้อมูลเก่า
async function batchSyncOrders() {
  const allOrders = await Order.find({});
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
      errors.push(`เกิดข้อผิดพลาดในการ sync ออเดอร์ ${order._id}: ${error}`);
    }
  }
  
  // อัปเดตสถิติของผู้ใช้ทั้งหมด
  for (const [userId, stats] of Object.entries(userStats)) {
    try {
      await User.findByIdAndUpdate(userId, {
        totalOrders: stats.totalOrders,
        totalSpent: stats.totalSpent,
        averageOrderValue: stats.totalSpent / stats.totalOrders,
        lastOrderDate: new Date()
      });
    } catch (error) {
      errors.push(`เกิดข้อผิดพลาดในการอัปเดตสถิติผู้ใช้ ${userId}: ${error}`);
    }
  }
  
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
    }
  } catch (error) {
    console.error('Error updating user stats:', error);
  }
}
