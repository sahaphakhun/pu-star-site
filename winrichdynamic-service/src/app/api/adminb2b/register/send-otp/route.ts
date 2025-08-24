import { NextRequest, NextResponse } from 'next/server';
import { requestOTP } from '@/utils/deesmsx';
import { formatPhoneNumber, isValidPhoneNumber } from '@/utils/phoneUtils';

// Global OTP cache สำหรับการสมัครสมาชิก
declare global {
  var registerOtpCache: Map<string, {
    otp: string;
    expiresAt: number;
    attempts: number;
    token: string;
    ref: string;
    userData: {
      name: string;
      phone: string;
      email: string;
      company: string;
      role: string;
    };
  }> | undefined;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, phone, email, company, role } = body;

    if (!name || !phone || !email) {
      return NextResponse.json(
        { success: false, error: 'กรุณากรอกข้อมูลให้ครบถ้วน' },
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

    // ส่งคำขอ OTP ผ่าน DeeSMSx
    try {
      const result = await requestOTP(formattedPhone);
      
      // เก็บ OTP ใน cache พร้อมข้อมูลผู้ใช้
      if (!global.registerOtpCache) {
        global.registerOtpCache = new Map();
      }
      
      global.registerOtpCache.set(formattedPhone, {
        otp: result.result.ref, // ใช้ ref เป็น OTP
        expiresAt: Date.now() + (5 * 60 * 1000), // หมดอายุใน 5 นาที
        attempts: 0,
        token: result.result.token,
        ref: result.result.ref,
        userData: {
          name: name.trim(),
          phone: formattedPhone,
          email: email.trim().toLowerCase(),
          company: company?.trim() || '',
          role: role || 'admin'
        }
      });

      console.log(`[B2B] Registration OTP sent to ${formattedPhone}: ${result.result.ref}`);
      
      return NextResponse.json({
        success: true,
        message: 'ส่ง OTP เรียบร้อยแล้ว',
        data: {
          phone: formattedPhone,
          expiresIn: '5 นาที'
        }
      });

    } catch (smsError) {
      console.error('[B2B] SMS sending error:', smsError);
      return NextResponse.json(
        { success: false, error: 'เกิดข้อผิดพลาดในการส่ง SMS กรุณาลองใหม่อีกครั้ง' },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('[B2B] Send registration OTP error:', error);
    return NextResponse.json(
      { success: false, error: 'เกิดข้อผิดพลาดในการส่ง OTP' },
      { status: 500 }
    );
  }
}
