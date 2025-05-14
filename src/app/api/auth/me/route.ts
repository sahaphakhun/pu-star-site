import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/models/User';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

interface DecodedToken {
  userId: string;
  phoneNumber?: string;
  role?: string;
  [key: string]: unknown;
}

export async function GET(req: Request) {
  try {
    // ดึงค่า token จาก cookie
    const cookieStore = cookies();
    const token = cookieStore.get('token');

    if (!token) {
      return NextResponse.json({
        success: false,
        message: 'ไม่พบข้อมูลการเข้าสู่ระบบ',
        isLoggedIn: false,
      });
    }

    try {
      // ถอดรหัส token
      const decoded = jwt.verify(
        token.value,
        process.env.JWT_SECRET || 'default_secret_replace_in_production'
      ) as DecodedToken;

      if (!decoded.userId) {
        return NextResponse.json({
          success: false,
          message: 'ข้อมูลการเข้าสู่ระบบไม่ถูกต้อง',
          isLoggedIn: false,
        });
      }

      // เชื่อมต่อกับฐานข้อมูล
      await connectDB();

      // ดึงข้อมูลผู้ใช้
      const user = await User.findById(decoded.userId);

      if (!user) {
        return NextResponse.json({
          success: false,
          message: 'ไม่พบข้อมูลผู้ใช้',
          isLoggedIn: false,
        });
      }

      return NextResponse.json({
        success: true,
        isLoggedIn: true,
        user: {
          _id: user._id,
          name: user.name,
          phoneNumber: user.phoneNumber,
          role: user.role,
        },
      });
    } catch (_) {
      // ถ้ามีข้อผิดพลาดในการถอดรหัส token
      return NextResponse.json({
        success: false,
        message: 'ข้อมูลการเข้าสู่ระบบไม่ถูกต้องหรือหมดอายุ',
        isLoggedIn: false,
      });
    }
  } catch (error) {
    console.error('เกิดข้อผิดพลาดในการตรวจสอบข้อมูลผู้ใช้:', error);
    return NextResponse.json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการตรวจสอบข้อมูลผู้ใช้',
      isLoggedIn: false,
    });
  }
} 