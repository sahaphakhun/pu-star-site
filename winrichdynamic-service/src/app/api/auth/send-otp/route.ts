import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Admin from '@/models/Admin';
import { requestOTP } from '@/utils/deesmsx';

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

    // ตรวจสอบว่าเบอร์โทรศัพท์มีในระบบหรือไม่
    const admin = await Admin.findOne({ phone });
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
      global.otpCache.delete(phone);
    }

    try {
      // ส่ง OTP ผ่าน DeeSMSx
      const otpResult = await requestOTP(phone);
      
      // เก็บ OTP ใน cache
      if (global.otpCache) {
        global.otpCache.set(phone, {
          otp: otpResult.result.ref, // ใช้ ref เป็น OTP
          expiresAt: Date.now() + 5 * 60 * 1000, // 5 นาที
          attempts: 0,
          token: otpResult.result.token,
          ref: otpResult.result.ref
        });
      }

      console.log(`[B2B] OTP sent to ${phone} for admin: ${admin.name}`);

      return NextResponse.json({
        success: true,
        message: 'ส่ง OTP สำเร็จ',
        data: {
          phone,
          expiresIn: 5 * 60, // 5 นาที
          adminName: admin.name
        }
      });

    } catch (smsError) {
      console.error('[B2B] SMS error:', smsError);
      
      // Fallback: สร้าง OTP จำลองสำหรับการทดสอบ
      const mockOtp = Math.random().toString().slice(2, 8);
      
      if (global.otpCache) {
        global.otpCache.set(phone, {
          otp: mockOtp,
          expiresAt: Date.now() + 5 * 60 * 1000, // 5 นาที
          attempts: 0,
          token: 'mock-token',
          ref: mockOtp
        });
      }

      console.log(`[B2B] Mock OTP created for ${phone}: ${mockOtp}`);

      return NextResponse.json({
        success: true,
        message: 'ส่ง OTP สำเร็จ (จำลอง)',
        data: {
          phone,
          expiresIn: 5 * 60, // 5 นาที
          adminName: admin.name,
          mockOtp: mockOtp // สำหรับการทดสอบ
        }
      });
    }

  } catch (error) {
    console.error('[B2B] Send OTP error:', error);
    return NextResponse.json(
      { success: false, error: 'เกิดข้อผิดพลาดในการส่ง OTP' },
      { status: 500 }
    );
  }
}
