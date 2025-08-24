import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Admin from '@/models/Admin';
import { requestOTP } from '@/utils/deesmsx';
import { formatPhoneNumber, isValidPhoneNumber } from '@/utils/phoneUtils';

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

if (!global.otpCache) {
  global.otpCache = new Map();
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const body = await request.json();
    const { phone } = body;

    if (!phone) {
      return NextResponse.json(
        { success: false, error: 'กรุณาระบุเบอร์โทรศัพท์' },
        { status: 400 }
      );
    }

    // ตรวจสอบและแปลงเบอร์โทรศัพท์
    if (!isValidPhoneNumber(phone)) {
      return NextResponse.json(
        { success: false, error: 'เบอร์โทรศัพท์ไม่ถูกต้อง กรุณากรอก 9-10 หลัก' },
        { status: 400 }
      );
    }

    let formattedPhone: string;
    try {
      formattedPhone = formatPhoneNumber(phone);
    } catch (error) {
      return NextResponse.json(
        { success: false, error: error instanceof Error ? error.message : 'เบอร์โทรศัพท์ไม่ถูกต้อง' },
        { status: 400 }
      );
    }

    // ตรวจสอบว่าเบอร์โทรศัพท์มีในระบบหรือไม่
    const admin = await Admin.findOne({ phone: formattedPhone });
    if (!admin) {
      return NextResponse.json(
        { success: false, error: 'ไม่พบผู้ใช้ในระบบ กรุณาสมัครสมาชิกก่อน' },
        { status: 404 }
      );
    }

    // ตรวจสอบว่า admin ยังใช้งานได้หรือไม่
    if (!admin.isActive) {
      return NextResponse.json(
        { success: false, error: 'บัญชีนี้ถูกระงับการใช้งาน' },
        { status: 403 }
      );
    }

    // ลบ OTP เก่าหากมี
    if (global.otpCache) {
      global.otpCache.delete(formattedPhone);
    }

    // ส่ง OTP ผ่าน DeeSMSx
    const otpResult = await requestOTP(formattedPhone);
    
    // เก็บ OTP ใน cache
    if (global.otpCache) {
      global.otpCache.set(formattedPhone, {
        otp: otpResult.result.ref, // ใช้ ref เป็น OTP
        expiresAt: Date.now() + 5 * 60 * 1000, // 5 นาที
        attempts: 0,
        token: otpResult.result.token,
        ref: otpResult.result.ref
      });
    }

    console.log(`[B2B] OTP sent to ${formattedPhone} for admin: ${admin.name}`);

    return NextResponse.json({
      success: true,
      message: 'ส่ง OTP สำเร็จ',
      data: {
        phone: formattedPhone,
        expiresIn: 5 * 60, // 5 นาที
        adminName: admin.name
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
