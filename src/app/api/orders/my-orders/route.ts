import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Order from '@/models/Order';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

interface DecodedToken {
  userId: string;
  [key: string]: unknown;
}

export async function GET() {
  try {
    // ดึงค่า token จาก cookie
    const cookieStore = (await cookies()) as any;
    const token = cookieStore.get?.('token') || cookieStore.get('token');

    if (!token) {
      return NextResponse.json(
        { success: false, message: 'กรุณาเข้าสู่ระบบก่อนดูรายการสั่งซื้อ' },
        { status: 401 }
      );
    }

    try {
      // ถอดรหัส token
      const decoded = jwt.verify(
        token.value,
        process.env.JWT_SECRET || 'default_secret_replace_in_production'
      ) as DecodedToken;

      if (!decoded.userId) {
        return NextResponse.json(
          { success: false, message: 'ข้อมูลการเข้าสู่ระบบไม่ถูกต้อง' },
          { status: 401 }
        );
      }

      // เชื่อมต่อกับฐานข้อมูล
      await connectDB();

      // ดึงข้อมูลออเดอร์: ถ้ามี userId ให้ใช้, else fallback ด้วยเบอร์โทร
      const orders = await Order.find({ 
        $or: [
          { userId: decoded.userId },
          { customerPhone: decoded.phoneNumber }
        ]
      })
      .sort({ orderDate: -1 })
      .lean();

      return NextResponse.json(orders);
    } catch (_error) {
      // ถ้ามีข้อผิดพลาดในการถอดรหัส token
      return NextResponse.json(
        { success: false, message: 'ข้อมูลการเข้าสู่ระบบไม่ถูกต้องหรือหมดอายุ' },
        { status: 401 }
      );
    }
  } catch (error) {
    console.error('เกิดข้อผิดพลาดในการดึงรายการสั่งซื้อ:', error);
    return NextResponse.json(
      { success: false, message: 'เกิดข้อผิดพลาดในการดึงรายการสั่งซื้อ' },
      { status: 500 }
    );
  }
} 