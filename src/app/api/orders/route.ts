import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Order from '@/models/Order';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import { sendSMS } from '@/utils/deesmsx';
import { orderInputSchema } from '@schemas/order';

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    // ดึงค่า query parameters
    const searchParams = request.nextUrl.searchParams;
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    let query = {};
    
    // ถ้ามีการระบุช่วงวันที่
    if (startDate && endDate) {
      query = {
        orderDate: {
          $gte: new Date(startDate),
          $lte: new Date(`${endDate}T23:59:59`)
        }
      };
    }

    // pagination & search
    const page = Number(searchParams.get('page') || '1');
    const limit = Math.min(Number(searchParams.get('limit') || '20'), 100);
    const q = searchParams.get('q') || '';
    const status = searchParams.get('status');

    if (q) {
      query = {
        ...query,
        $or: [
          { customerName: { $regex: q, $options: 'i' } },
          { customerPhone: { $regex: q, $options: 'i' } },
          { _id: { $regex: q, $options: 'i' } },
        ],
      } as any;
    }
    if (status) {
      query = { ...query, status } as any;
    }

    const total = await Order.countDocuments(query);
    const orders = await Order.find(query)
      .sort({ orderDate: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();
    return NextResponse.json({ data: orders, total, page, limit, totalPages: Math.ceil(total / limit) });
  } catch (error) {
    console.error('Error fetching orders:', error);
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการดึงข้อมูลคำสั่งซื้อ' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const raw = await request.json();

    // ดึง token เพื่อหา userId และเบอร์โทรหากไม่ส่งมา
    const cookieStore = (await cookies()) as any;
    const tokenCookie = cookieStore.get?.('token') || cookieStore.get('token');

    let userId: string | undefined;
    if (tokenCookie) {
      try {
        const decoded = jwt.verify(tokenCookie.value, process.env.JWT_SECRET || 'default_secret_replace_in_production') as any;
        userId = decoded.userId;
        if (!raw.customerPhone) raw.customerPhone = decoded.phoneNumber;
      } catch {}
    }

    const parsed = orderInputSchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json({ error: 'รูปแบบข้อมูลไม่ถูกต้อง', details: parsed.error.errors }, { status: 400 });
    }
    const data = parsed.data;

    await connectDB();

    const order = await Order.create({
      ...data,
      customerPhone: data.customerPhone,
      orderDate: new Date(),
      ...(userId && { userId })
    });

    // ส่ง SMS แจ้งเตือนลูกค้า
    try {
      const origin = request.headers.get('origin') || process.env.NEXT_PUBLIC_SITE_URL || '';
      const orderUrl = `${origin}/my-orders`;
      const smsMessage = `ขอบคุณสำหรับการสั่งซื้อ #${order._id.toString().slice(-8).toUpperCase()} ยอดรวม ${data.totalAmount.toLocaleString()} บาท\nตรวจสอบรายละเอียดที่ ${orderUrl}`;
      await sendSMS(data.customerPhone, smsMessage);
    } catch (smsErr) {
      console.error('ส่ง SMS แจ้งเตือนล้มเหลว:', smsErr);
    }

    return NextResponse.json(order, { status: 201 });
  } catch (error) {
    console.error('Error creating order:', error);
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการสร้างคำสั่งซื้อ' },
      { status: 500 }
    );
  }
} 