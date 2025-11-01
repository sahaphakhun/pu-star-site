import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/models/User';
import Order from '@/models/Order';
import { verifyToken } from '@/lib/auth';
import { updateCustomerStats } from '@/utils/customerAnalytics';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // ตรวจสอบสิทธิ์ admin
    const authResult = await verifyToken(request);
    if (!authResult.valid || authResult.decoded?.role !== 'admin') {
      return NextResponse.json({ error: 'ไม่มีสิทธิ์เข้าถึง' }, { status: 403 });
    }

    await connectDB();

    const { id } = params;

    // ดึงข้อมูลลูกค้า
    const customer = await User.findById(id).lean();
    
    if (!customer) {
      return NextResponse.json({ error: 'ไม่พบลูกค้า' }, { status: 404 });
    }

    // ดึงออเดอร์ของลูกค้า
    const orders = await Order.find({ userId: id })
      .sort({ orderDate: -1 })
      .populate('items.productId', 'name imageUrl')
      .lean();

    // คำนวณสถิติเพิ่มเติม
    const completedOrders = orders.filter(order => 
      ['delivered', 'confirmed', 'shipped'].includes(order.status)
    );
    
    const pendingOrders = orders.filter(order => 
      ['pending', 'packing'].includes(order.status)
    );

    const cancelledOrders = orders.filter(order => 
      order.status === 'cancelled'
    );

    // สินค้าที่ซื้อบ่อย
    const productFrequency: { [key: string]: { count: number, name: string, total: number } } = {};
    
    completedOrders.forEach(order => {
      order.items.forEach(item => {
        const productId = item.productId.toString();
        if (!productFrequency[productId]) {
          productFrequency[productId] = { 
            count: 0, 
            name: item.name,
            total: 0
          };
        }
        productFrequency[productId].count += item.quantity;
        productFrequency[productId].total += item.price * item.quantity;
      });
    });

    const topProducts = Object.entries(productFrequency)
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 5)
      .map(([productId, data]) => ({
        productId,
        name: data.name,
        quantity: data.count,
        totalValue: data.total
      }));

    // ยอดขายรายเดือน (6 เดือนล่าสุด)
    const monthlyData = [];
    const now = new Date();
    
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const nextMonth = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
      
      const monthOrders = completedOrders.filter(order => {
        const orderDate = new Date(order.orderDate);
        return orderDate >= date && orderDate < nextMonth;
      });

      const monthTotal = monthOrders.reduce((sum, order) => sum + order.totalAmount, 0);
      
      monthlyData.push({
        month: date.toLocaleDateString('th-TH', { year: 'numeric', month: 'short' }),
        orders: monthOrders.length,
        total: monthTotal
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        customer,
        orders: orders.slice(0, 20), // แสดงแค่ 20 ออเดอร์ล่าสุด
        stats: {
          totalOrders: orders.length,
          completedOrders: completedOrders.length,
          pendingOrders: pendingOrders.length,
          cancelledOrders: cancelledOrders.length,
          totalSpent: completedOrders.reduce((sum, order) => sum + order.totalAmount, 0),
          averageOrderValue: completedOrders.length > 0 ? 
            completedOrders.reduce((sum, order) => sum + order.totalAmount, 0) / completedOrders.length : 0,
          topProducts,
          monthlyData
        }
      }
    });

  } catch (error) {
    console.error('Error fetching customer details:', error);
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการดึงข้อมูลลูกค้า' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // ตรวจสอบสิทธิ์ admin
    const authResult = await verifyToken(request);
    if (!authResult.valid || authResult.decoded?.role !== 'admin') {
      return NextResponse.json({ error: 'ไม่มีสิทธิ์เข้าถึง' }, { status: 403 });
    }

    await connectDB();

    const { id } = params;
    const updates = await request.json();

    // อัปเดตข้อมูลลูกค้า
    const customer = await User.findByIdAndUpdate(
      id,
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!customer) {
      return NextResponse.json({ error: 'ไม่พบลูกค้า' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: customer
    });

  } catch (error) {
    console.error('Error updating customer:', error);
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการอัปเดตข้อมูลลูกค้า' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // ตรวจสอบสิทธิ์ admin
    const authResult = await verifyToken(request);
    if (!authResult.valid || authResult.decoded?.role !== 'admin') {
      return NextResponse.json({ error: 'ไม่มีสิทธิ์เข้าถึง' }, { status: 403 });
    }

    await connectDB();

    const { id } = params;

    // ตรวจสอบว่ามีออเดอร์ที่ยังไม่เสร็จสิ้น
    const pendingOrders = await Order.countDocuments({
      userId: id,
      status: { $in: ['pending', 'confirmed', 'packing', 'shipped'] }
    });

    if (pendingOrders > 0) {
      return NextResponse.json({
        error: 'ไม่สามารถลบลูกค้าได้ เนื่องจากมีออเดอร์ที่ยังไม่เสร็จสิ้น'
      }, { status: 400 });
    }

    // ลบลูกค้า
    const customer = await User.findByIdAndDelete(id);

    if (!customer) {
      return NextResponse.json({ error: 'ไม่พบลูกค้า' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'ลบลูกค้าเรียบร้อยแล้ว'
    });

  } catch (error) {
    console.error('Error deleting customer:', error);
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการลบลูกค้า' },
      { status: 500 }
    );
  }
} 