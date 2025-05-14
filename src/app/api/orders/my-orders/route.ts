import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import connectDB from '@/lib/db';
import Order from '@/models/Order';

export async function GET(req: Request) {
  try {
    // รับ token จาก cookies
    const cookieHeader = req.headers.get('cookie');
    if (!cookieHeader) {
      return NextResponse.json({ message: 'ไม่ได้ล็อกอิน' }, { status: 401 });
    }

    const token = cookieHeader
      .split(';')
      .find(c => c.trim().startsWith('token='))
      ?.split('=')[1];

    if (!token) {
      return NextResponse.json({ message: 'ไม่ได้ล็อกอิน' }, { status: 401 });
    }

    // ตรวจสอบ token
    try {
      const decoded = jwt.verify(
        token, 
        process.env.JWT_SECRET || 'default_secret_replace_in_production'
      ) as { userId: string; phoneNumber: string };

      // เชื่อมต่อกับฐานข้อมูล
      await connectDB();

      // ดึงรายการคำสั่งซื้อตามเบอร์โทรศัพท์
      const orders = await Order.find({ 
        customerPhone: decoded.phoneNumber 
      }).sort({ orderDate: -1 }); // เรียงตามวันที่ล่าสุด

      return NextResponse.json(orders);
    } catch (error) {
      // Token ไม่ถูกต้องหรือหมดอายุ
      return NextResponse.json({ message: 'ไม่ได้ล็อกอิน' }, { status: 401 });
    }
  } catch (error) {
    console.error('เกิดข้อผิดพลาดในการดึงประวัติการสั่งซื้อ:', error);
    return NextResponse.json(
      { message: 'เกิดข้อผิดพลาดในการดึงประวัติการสั่งซื้อ' },
      { status: 500 }
    );
  }
} 