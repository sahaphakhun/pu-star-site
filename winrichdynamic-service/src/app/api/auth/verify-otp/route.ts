import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Admin from '@/models/Admin';
import { verifyOTP } from '@/utils/deesmsx';
import * as jose from 'jose';

// Global OTP cache (ใน production ควรใช้ Redis)
declare global {
  var otpCache: Map<string, {
    otp: string;
    expiresAt: number;
    attempts: number;
    token: string;
    ref: string;
  }> | undefined;
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const body = await request.json();
    const { phone, otp } = body;

    if (!phone || !otp) {
      return NextResponse.json(
        { success: false, error: 'กรุณาระบุเบอร์โทรศัพท์และรหัส OTP' },
        { status: 400 }
      );
    }

    // ตรวจสอบ OTP ใน cache
    if (!global.otpCache) {
      return NextResponse.json(
        { success: false, error: 'OTP หมดอายุ กรุณาขอใหม่' },
        { status: 400 }
      );
    }

    const otpData = global.otpCache.get(phone);
    if (!otpData) {
      return NextResponse.json(
        { success: false, error: 'OTP หมดอายุ กรุณาขอใหม่' },
        { status: 400 }
      );
    }

    // ตรวจสอบว่า OTP หมดอายุหรือไม่
    if (Date.now() > otpData.expiresAt) {
      global.otpCache.delete(phone);
      return NextResponse.json(
        { success: false, error: 'OTP หมดอายุ กรุณาขอใหม่' },
        { status: 400 }
      );
    }

    // ตรวจสอบจำนวนครั้งที่ลอง
    if (otpData.attempts >= 3) {
      global.otpCache.delete(phone);
      return NextResponse.json(
        { success: false, error: 'ลอง OTP เกินจำนวนครั้งที่กำหนด กรุณาขอใหม่' },
        { status: 400 }
      );
    }

    // เพิ่มจำนวนครั้งที่ลอง
    otpData.attempts++;

    // ตรวจสอบ OTP ผ่าน DeeSMSx
    let isValidOtp = false;
    
    try {
      await verifyOTP(otpData.token, otp);
      isValidOtp = true;
    } catch (verifyError) {
      console.error('[B2B] OTP verification error:', verifyError);
      isValidOtp = false;
    }

    if (!isValidOtp) {
      return NextResponse.json(
        { success: false, error: 'รหัส OTP ไม่ถูกต้อง' },
        { status: 400 }
      );
    }

    // ค้นหา admin
    const admin = await Admin.findOne({ phone }).populate('role', 'name level');
    if (!admin) {
      return NextResponse.json(
        { success: false, error: 'ไม่พบผู้ใช้ในระบบ' },
        { status: 404 }
      );
    }

    // สร้าง JWT token
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      return NextResponse.json(
        { success: false, error: 'JWT secret ไม่ถูกต้อง' },
        { status: 500 }
      );
    }

    const token = await new jose.SignJWT({
      adminId: admin._id.toString(),
      phone: admin.phone,
      role: admin.role.name,
      roleLevel: admin.role.level
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('24h')
      .sign(new TextEncoder().encode(secret));

    // อัปเดต lastLoginAt
    admin.lastLoginAt = new Date();
    await admin.save();

    // ลบ OTP จาก cache
    global.otpCache.delete(phone);

    console.log(`[B2B] Admin logged in: ${admin.name} (${phone})`);

    return NextResponse.json({
      success: true,
      message: 'เข้าสู่ระบบสำเร็จ',
      data: {
        token,
        admin: {
          id: admin._id,
          name: admin.name,
          phone: admin.phone,
          email: admin.email,
          company: admin.company,
          role: admin.role.name,
          roleLevel: admin.role.level
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
