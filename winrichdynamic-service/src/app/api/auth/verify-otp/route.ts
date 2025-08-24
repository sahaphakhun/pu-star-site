import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Admin from '@/models/Admin';
import jwt from 'jsonwebtoken';
import { verifyOTP } from '@/utils/deesmsx';

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const body = await request.json();
    const { phone, otp } = body;

    if (!phone || !otp) {
      return NextResponse.json(
        { success: false, error: 'กรุณากรอกเบอร์โทรศัพท์และ OTP' },
        { status: 400 }
      );
    }

    // ตรวจสอบ OTP จาก cache
    global.otpCache = global.otpCache || new Map();
    const otpData = global.otpCache.get(phone);

    if (!otpData) {
      return NextResponse.json(
        { success: false, error: 'OTP หมดอายุหรือไม่ถูกต้อง' },
        { status: 400 }
      );
    }

    // ตรวจสอบ OTP หมดอายุ
    if (Date.now() > otpData.expiresAt) {
      global.otpCache.delete(phone);
      return NextResponse.json(
        { success: false, error: 'OTP หมดอายุแล้ว กรุณาส่งใหม่' },
        { status: 400 }
      );
    }

    // ตรวจสอบจำนวนครั้งที่ลอง
    if (otpData.attempts >= 3) {
      global.otpCache.delete(phone);
      return NextResponse.json(
        { success: false, error: 'ลอง OTP เกินจำนวนครั้งที่กำหนด กรุณาส่งใหม่' },
        { status: 400 }
      );
    }

    // ยืนยัน OTP ผ่าน DeeSMSx API
    try {
      await verifyOTP(otpData.token, otp);
    } catch (error) {
      otpData.attempts += 1;
      global.otpCache.set(phone, otpData);
      
      console.error('[B2B] OTP verification failed:', error);
      return NextResponse.json(
        { success: false, error: 'OTP ไม่ถูกต้อง' },
        { status: 400 }
      );
    }

    // ค้นหาผู้ดูแลระบบ
    const admin = await Admin.findOne({ phone }).populate('role', 'name level');
    
    if (!admin) {
      return NextResponse.json(
        { success: false, error: 'ไม่พบผู้ใช้ในระบบ' },
        { status: 404 }
      );
    }

    if (!admin.isActive) {
      return NextResponse.json(
        { success: false, error: 'บัญชีผู้ใช้ถูกระงับการใช้งาน' },
        { status: 401 }
      );
    }

    // ลบ OTP จาก cache
    global.otpCache.delete(phone);

    // อัปเดตเวลาล็อกอินล่าสุด
    admin.lastLoginAt = new Date();
    await admin.save();

    // สร้าง JWT token
    const secret = process.env.JWT_SECRET || 'your-secret-key';
    const token = jwt.sign(
      {
        adminId: admin._id,
        phone: admin.phone,
        role: admin.role?.name || 'admin',
        roleLevel: admin.role?.level || 1
      },
      secret,
      { expiresIn: '7d' }
    );

    return NextResponse.json({
      success: true,
      message: 'เข้าสู่ระบบสำเร็จ',
      token,
      data: {
        admin: {
          id: admin._id,
          name: admin.name,
          phone: admin.phone,
          role: admin.role?.name || 'admin',
          roleLevel: admin.role?.level || 1
        }
      }
    });

  } catch (error) {
    console.error('[B2B] Verify OTP error:', error);
    return NextResponse.json(
      { success: false, error: 'เกิดข้อผิดพลาดในการยืนยัน OTP' },
      { status: 500 }
    );
  }
}
