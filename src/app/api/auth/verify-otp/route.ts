import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import connectDB from '@/lib/db';
import User from '@/models/User';
import OTPVerification from '@/models/OTPVerification';
import { verifyOTP, formatPhoneNumber } from '@/utils/deesmsx';

export async function POST(req: Request) {
  try {
    const { phoneNumber, otp, name } = await req.json();

    if (!phoneNumber || !otp) {
      return NextResponse.json(
        { success: false, message: 'กรุณาระบุเบอร์โทรศัพท์และรหัส OTP' },
        { status: 400 }
      );
    }

    // แปลงและตรวจสอบเบอร์โทรศัพท์ให้เป็นรูปแบบ E.164 (66xxxxxxxxx)
    const formattedPhoneNumber = formatPhoneNumber(phoneNumber);

    if (!/^66\d{9}$/.test(formattedPhoneNumber)) {
      return NextResponse.json(
        { success: false, message: 'รูปแบบเบอร์โทรศัพท์ไม่ถูกต้อง' },
        { status: 400 }
      );
    }

    // เชื่อมต่อกับฐานข้อมูล
    await connectDB();

    // ค้นหาข้อมูล OTP
    const otpRecord = await OTPVerification.findOne({ phoneNumber: formattedPhoneNumber });

    // ตรวจสอบว่า OTP record มีอยู่จริงหรือไม่
    if (!otpRecord) {
      return NextResponse.json(
        { success: false, message: 'ไม่พบข้อมูล OTP สำหรับเบอร์โทรศัพท์นี้ กรุณาขอรหัส OTP ใหม่' },
        { status: 400 }
      );
    }

    // ตรวจสอบว่า OTP หมดอายุหรือไม่
    if (otpRecord.expiresAt < new Date()) {
      await OTPVerification.deleteOne({ _id: otpRecord._id });
      return NextResponse.json(
        { success: false, message: 'รหัส OTP หมดอายุแล้ว กรุณาขอรหัสใหม่' },
        { status: 400 }
      );
    }

    try {
      // ตรวจสอบ OTP กับ DeeSMSx API
      await verifyOTP(otpRecord.token, otp);

      // หาหรือสร้างผู้ใช้ใหม่
      let user = await User.findOne({ phoneNumber: formattedPhoneNumber });
      
      if (!user) {
        // หากไม่มีข้อมูลชื่อ ให้ใช้ค่าว่างหรือเบอร์โทรแทน
        user = await User.create({
          name: name || formattedPhoneNumber, // เก็บชื่อเป็นเบอร์หรือค่าว่างได้ตามต้องการ
          phoneNumber: formattedPhoneNumber,
          isVerified: true,
        });
      } else {
        // อัปเดตสถานะการยืนยันของผู้ใช้ที่มีอยู่
        user.isVerified = true;
        await user.save();
      }

      // ลบ OTP record เมื่อยืนยันเสร็จสิ้น
      await OTPVerification.deleteOne({ _id: otpRecord._id });

      // สร้าง JWT token เพื่อใช้ในการล็อกอิน
      const token = jwt.sign(
        { userId: user._id, phoneNumber: user.phoneNumber, role: user.role },
        process.env.JWT_SECRET || 'default_secret_replace_in_production',
        { expiresIn: '7d' }
      );

      // ตั้งค่า cookie สำหรับเซสชัน
      const response = NextResponse.json({
        success: true,
        message: 'ยืนยันตัวตนสำเร็จ',
        user: {
          _id: user._id,
          name: user.name,
          phoneNumber: user.phoneNumber,
          role: user.role,
        },
      });

      // ตั้งค่า token ใน cookie
      response.cookies.set({
        name: 'token',
        value: token,
        httpOnly: true,
        maxAge: 60 * 60 * 24 * 7, // 7 วัน
        path: '/',
        sameSite: 'strict',
        secure: process.env.NODE_ENV === 'production',
      });

      return response;
    } catch (error: Error | unknown) {
      console.error('เกิดข้อผิดพลาดในการตรวจสอบ OTP:', error);
      const errorMessage = error instanceof Error ? error.message : 'เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ';
      return NextResponse.json(
        { success: false, message: `รหัส OTP ไม่ถูกต้อง: ${errorMessage}` },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('เกิดข้อผิดพลาดในการตรวจสอบ OTP:', error);
    return NextResponse.json(
      { success: false, message: 'เกิดข้อผิดพลาดในการตรวจสอบ OTP' },
      { status: 500 }
    );
  }
} 