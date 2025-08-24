import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Admin from '@/models/Admin';
import jwt from 'jsonwebtoken';

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'กรุณากรอกอีเมลและรหัสผ่าน' },
        { status: 400 }
      );
    }

    // ค้นหาผู้ดูแลระบบ
    const admin = await Admin.findOne({ email }).populate('role', 'name level');
    
    if (!admin) {
      return NextResponse.json(
        { success: false, error: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง' },
        { status: 401 }
      );
    }

    if (!admin.isActive) {
      return NextResponse.json(
        { success: false, error: 'บัญชีผู้ใช้ถูกระงับการใช้งาน' },
        { status: 401 }
      );
    }

    // ตรวจสอบรหัสผ่าน
    const isValidPassword = await admin.comparePassword(password);
    if (!isValidPassword) {
      return NextResponse.json(
        { success: false, error: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง' },
        { status: 401 }
      );
    }

    // อัปเดตเวลาล็อกอินล่าสุด
    admin.lastLoginAt = new Date();
    await admin.save();

    // สร้าง JWT token
    const secret = process.env.JWT_SECRET || 'your-secret-key';
    const token = jwt.sign(
      {
        adminId: admin._id,
        email: admin.email,
        role: admin.role.name,
        roleLevel: admin.role.level
      },
      secret,
      { expiresIn: '7d' }
    );

    const response = NextResponse.json({ 
      success: true,
      message: 'เข้าสู่ระบบสำเร็จ',
      data: {
        admin: {
          id: admin._id,
          name: admin.name,
          email: admin.email,
          role: admin.role.name,
          roleLevel: admin.role.level
        }
      }
    });

    // ตั้งค่า cookie
    response.cookies.set('b2b_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7 // 7 days
    });

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { success: false, error: 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ' },
      { status: 500 }
    );
  }
}


