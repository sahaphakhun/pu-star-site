import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Order from '@/models/Order';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import { sendSMS } from '@/utils/deesmsx';

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

    const orders = await Order.find(query).sort({ orderDate: -1 });
    return NextResponse.json(orders);
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
    const body = await request.json();
    const { customerName, customerPhone, customerAddress = '', paymentMethod = 'cod', slipUrl = '', shippingFee = 0, discount = 0, items, totalAmount } = body;

    // กำหนด phone เบื้องต้นจาก payload
    let phone = customerPhone;
    let userId: string | undefined;

    // ดึง token เพื่อหา userId และเบอร์โทร (กรณีไม่ส่งมา)
    const cookieStore = (await cookies()) as any;
    const tokenCookie = cookieStore.get?.('token') || cookieStore.get('token');
    if (tokenCookie) {
      try {
        const decoded = jwt.verify(tokenCookie.value, process.env.JWT_SECRET || 'default_secret_replace_in_production') as any;
        userId = decoded.userId;
        if (!phone) phone = decoded.phoneNumber;
      } catch {}
    }

    // ตรวจสอบข้อมูลที่จำเป็น
    if (!customerName || !phone || !totalAmount) {
      return NextResponse.json(
        { error: 'กรุณากรอกข้อมูลให้ครบถ้วน' },
        { status: 400 }
      );
    }

    await connectDB();
    
    const order = await Order.create({
      customerName,
      customerPhone: phone,
      customerAddress,
      paymentMethod,
      slipUrl,
      items,
      shippingFee,
      discount,
      totalAmount,
      orderDate: new Date(),
      ...(userId && { userId })
    });

    // ส่ง SMS แจ้งเตือนลูกค้า
    try {
      const origin = request.headers.get('origin') || process.env.NEXT_PUBLIC_SITE_URL || '';
      const orderUrl = `${origin}/my-orders`;
      const smsMessage = `ขอบคุณสำหรับการสั่งซื้อ #${order._id.toString().slice(-8).toUpperCase()} ยอดรวม ${totalAmount.toLocaleString()} บาท\nตรวจสอบรายละเอียดที่ ${orderUrl}`;
      await sendSMS(phone, smsMessage);
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