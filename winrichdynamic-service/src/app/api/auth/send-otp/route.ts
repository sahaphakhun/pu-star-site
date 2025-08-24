import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Admin from '@/models/Admin';
import { requestOTP } from '@/utils/deesmsx';

// ประกาศ type สำหรับ global OTP cache
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
    const { phone } = body;

    if (!phone || phone.length < 10) {
      return NextResponse.json(
        { success: false, error: 'กรุณากรอกเบอร์โทรศัพท์ให้ถูกต้อง' },
        { status: 400 }
      );
    }

    // ค้นหาผู้ดูแลระบบด้วยเบอร์โทรศัพท์
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

    // ส่งคำขอ OTP ผ่าน DeeSMSx
    const otpResult = await requestOTP(phone);
    
    // เก็บข้อมูล OTP ใน cache พร้อม token และ ref จาก DeeSMSx
    global.otpCache = global.otpCache || new Map();
    global.otpCache.set(phone, {
      otp: otpResult.result.ref, // ใช้ ref เป็น OTP
      expiresAt: Date.now() + 5 * 60 * 1000, // 5 นาที
      attempts: 0,
      token: otpResult.result.token,
      ref: otpResult.result.ref
    });

    console.log(`[B2B] OTP sent via DeeSMSx to ${phone}, ref: ${otpResult.result.ref}`);

    return NextResponse.json({
      success: true,
      message: 'ส่ง OTP เรียบร้อยแล้ว',
      data: {
        phone,
        expiresIn: 5 * 60 // 5 นาที
      }
    });

  } catch (error) {
    console.error('[B2B] Send OTP error:', error);
    return NextResponse.json(
      { success: false, error: 'เกิดข้อผิดพลาดในการส่ง OTP' },
      { status: 500 }
    );
  }
}
