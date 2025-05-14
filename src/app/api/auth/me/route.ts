import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import connectDB from '@/lib/db';
import User from '@/models/User';

export async function GET(req: Request) {
  try {
    // รับ token จาก cookies
    const cookieHeader = req.headers.get('cookie');
    if (!cookieHeader) {
      return NextResponse.json({ isLoggedIn: false }, { status: 401 });
    }

    const token = cookieHeader
      .split(';')
      .find(c => c.trim().startsWith('token='))
      ?.split('=')[1];

    if (!token) {
      return NextResponse.json({ isLoggedIn: false }, { status: 401 });
    }

    // ตรวจสอบ token
    try {
      const decoded = jwt.verify(
        token, 
        process.env.JWT_SECRET || 'default_secret_replace_in_production'
      ) as { userId: string };

      // เชื่อมต่อกับฐานข้อมูล
      await connectDB();

      // ดึงข้อมูลผู้ใช้
      const user = await User.findById(decoded.userId).select('-password');

      if (!user) {
        return NextResponse.json({ isLoggedIn: false }, { status: 401 });
      }

      return NextResponse.json({ 
        isLoggedIn: true, 
        user: {
          _id: user._id,
          name: user.name,
          phoneNumber: user.phoneNumber,
          email: user.email,
          role: user.role,
          isVerified: user.isVerified
        }
      });
    } catch (error) {
      // Token ไม่ถูกต้องหรือหมดอายุ
      return NextResponse.json({ isLoggedIn: false }, { status: 401 });
    }
  } catch (error) {
    console.error('เกิดข้อผิดพลาดในการตรวจสอบผู้ใช้:', error);
    return NextResponse.json(
      { isLoggedIn: false, message: 'เกิดข้อผิดพลาดในการตรวจสอบผู้ใช้' },
      { status: 500 }
    );
  }
} 