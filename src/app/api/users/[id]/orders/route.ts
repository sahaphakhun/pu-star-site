import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import Order from '@/models/Order';
import User from '@/models/User';

// GET: ดึงออเดอร์ของผู้ใช้
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectToDatabase();
    
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const status = searchParams.get('status');
    
    const userId = params.id;
    
    // ตรวจสอบว่าผู้ใช้มีอยู่จริง
    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'ไม่พบผู้ใช้ที่ระบุ' },
        { status: 404 }
      );
    }
    
    // สร้าง query สำหรับออเดอร์
    const query: any = { userId };
    if (status && status !== 'all') {
      query.status = status;
    }
    
    // ดึงออเดอร์พร้อม pagination
    const skip = (page - 1) * limit;
    const orders = await Order.find(query)
      .select('_id customerName customerPhone totalAmount status createdAt updatedAt items')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    
    // นับจำนวนออเดอร์ทั้งหมด
    const totalOrders = await Order.countDocuments(query);
    const totalPages = Math.ceil(totalOrders / limit);
    
    // คำนวณสถิติ
    const totalSpent = orders.reduce((sum, order) => sum + order.totalAmount, 0);
    const averageOrderValue = orders.length > 0 ? totalSpent / orders.length : 0;
    
    return NextResponse.json({
      success: true,
      data: {
        user: {
          _id: user._id,
          name: user.name,
          phoneNumber: user.phoneNumber,
          email: user.email,
          customerType: user.customerType
        },
        orders,
        pagination: {
          page,
          limit,
          totalOrders,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1
        },
        stats: {
          totalSpent,
          averageOrderValue,
          orderCount: orders.length
        }
      }
    });
    
  } catch (error) {
    console.error('Error in user orders API:', error);
    return NextResponse.json(
      { success: false, error: 'เกิดข้อผิดพลาดในการดึงข้อมูล' },
      { status: 500 }
    );
  }
}
