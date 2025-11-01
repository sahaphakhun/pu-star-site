import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Admin from '@/models/Admin';
import OTPVerification from '@/models/OTPVerification';
import { verifyOTP, formatPhoneNumber } from '@/utils/deesmsx';
import * as jose from 'jose';

export async function POST(req: Request) {
  try {
    const { phone, otp } = await req.json();

    if (!phone || !otp) {
      return NextResponse.json(
        { success: false, error: 'กรุณาระบุเบอร์โทรศัพท์และรหัส OTP' },
        { status: 400 }
      );
    }

    // แปลงและตรวจสอบเบอร์โทรศัพท์ให้เป็นรูปแบบ E.164 (66xxxxxxxxx)
    const formattedPhone = formatPhoneNumber(phone);

    if (!/^66\d{9}$/.test(formattedPhone)) {
      return NextResponse.json(
        { success: false, error: 'รูปแบบเบอร์โทรศัพท์ไม่ถูกต้อง' },
        { status: 400 }
      );
    }

    // เชื่อมต่อกับฐานข้อมูล
    await connectDB();

    // ค้นหาข้อมูล OTP
    const otpRecord = await OTPVerification.findOne({ phoneNumber: formattedPhone });

    // ตรวจสอบว่า OTP record มีอยู่จริงหรือไม่
    if (!otpRecord) {
      return NextResponse.json(
        { success: false, error: 'ไม่พบข้อมูล OTP สำหรับเบอร์โทรศัพท์นี้ กรุณาขอรหัส OTP ใหม่' },
        { status: 400 }
      );
    }

    // ตรวจสอบว่า OTP หมดอายุหรือไม่
    if (otpRecord.expiresAt < new Date()) {
      await OTPVerification.deleteOne({ _id: otpRecord._id });
      return NextResponse.json(
        { success: false, error: 'รหัส OTP หมดอายุแล้ว กรุณาขอรหัสใหม่' },
        { status: 400 }
      );
    }

    try {
      // ตรวจสอบ OTP กับ DeeSMSx API
      await verifyOTP(otpRecord.token, otp);

      // ค้นหา admin
      const admin = await Admin.findOne({ phone: formattedPhone }).populate('role', 'name level');
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

      // สร้าง JWT token
      const secret = process.env.JWT_SECRET || 'b2b-winrichdynamic-jwt-secret-2024';
      console.log('[B2B] Using JWT secret:', secret ? 'configured' : 'fallback');

      let token: string;
      try {
        token = await new jose.SignJWT({
          adminId: admin._id.toString(),
          phone: admin.phone,
          role: admin.role.name,
          roleLevel: admin.role.level
        })
          .setProtectedHeader({ alg: 'HS256' })
          .setIssuedAt()
          .setExpirationTime('24h')
          .sign(new TextEncoder().encode(secret));
        
        console.log('[B2B] JWT token created successfully');
      } catch (jwtError) {
        console.error('[B2B] JWT creation error:', jwtError);
        return NextResponse.json(
          { success: false, error: 'เกิดข้อผิดพลาดในการสร้าง token' },
          { status: 500 }
        );
      }

      // อัปเดต lastLoginAt
      admin.lastLoginAt = new Date();
      await admin.save();

      // ลบ OTP record เมื่อยืนยันเสร็จสิ้น
      await OTPVerification.deleteOne({ _id: otpRecord._id });

      console.log(`[B2B] Admin logged in: ${admin.name} (${formattedPhone})`);

      // สร้าง response พร้อม cookie
      const response = NextResponse.json({
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

      // ตั้งค่า cookie สำหรับ token
      response.cookies.set('b2b_token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 24 * 60 * 60, // 24 ชั่วโมง
        path: '/'
      });

      return response;
    } catch (error: Error | unknown) {
      console.error('[B2B] เกิดข้อผิดพลาดในการตรวจสอบ OTP:', error);
      const errorMessage = error instanceof Error ? error.message : 'เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ';
      return NextResponse.json(
        { success: false, error: `รหัส OTP ไม่ถูกต้อง: ${errorMessage}` },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('[B2B] เกิดข้อผิดพลาดในการตรวจสอบ OTP:', error);
    
    // Log detailed error for debugging
    if (error instanceof Error) {
      console.error('[B2B] Error message:', error.message);
      console.error('[B2B] Error stack:', error.stack);
    }
    
    return NextResponse.json(
      { success: false, error: 'เกิดข้อผิดพลาดในการตรวจสอบ OTP' },
      { status: 500 }
    );
  }
}
