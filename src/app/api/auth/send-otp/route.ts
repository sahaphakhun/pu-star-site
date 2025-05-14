import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/models/User';
import OTPVerification from '@/models/OTPVerification';
import { requestOTP } from '@/utils/deesmsx';

// ฟังก์ชันสำหรับสร้าง OTP
function generateOTP(length = 6) {
  const digits = '0123456789';
  let OTP = '';
  for (let i = 0; i < length; i++) {
    OTP += digits[Math.floor(Math.random() * 10)];
  }
  return OTP;
}

// API Handler สำหรับส่ง OTP
export async function POST(req: Request) {
  try {
    const { phoneNumber } = await req.json();

    if (!phoneNumber) {
      return NextResponse.json(
        { success: false, message: 'กรุณาระบุเบอร์โทรศัพท์' },
        { status: 400 }
      );
    }

    // ตรวจสอบรูปแบบเบอร์โทรศัพท์
    const thaiPhoneRegex = /^0\d{9}$/;  // เบอร์ไทยที่ขึ้นต้นด้วย 0 เช่น 0812345678
    const e164PhoneRegex = /^66\d{9}$/; // เบอร์ในรูปแบบ E.164 เช่น 66812345678

    // ตรวจสอบรูปแบบเบอร์โทรศัพท์และแปลงให้เป็นรูปแบบที่ DeeSMSx ต้องการ
    let formattedPhoneNumber = '';
    if (thaiPhoneRegex.test(phoneNumber)) {
      // แปลงเบอร์ไทย 08xxxxxxxx เป็น 668xxxxxxxx
      formattedPhoneNumber = '66' + phoneNumber.substring(1);
    } else if (e164PhoneRegex.test(phoneNumber)) {
      // เบอร์อยู่ในรูปแบบที่ถูกต้องแล้ว
      formattedPhoneNumber = phoneNumber;
    } else {
      return NextResponse.json(
        { success: false, message: 'รูปแบบเบอร์โทรศัพท์ไม่ถูกต้อง' },
        { status: 400 }
      );
    }

    // เชื่อมต่อกับฐานข้อมูล
    await connectDB();

    try {
      // ส่งคำขอ OTP ไปยัง DeeSMSx API
      const otpResponse = await requestOTP(formattedPhoneNumber);
      
      // คำนวณเวลาหมดอายุ (5 นาที)
      const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

      // บันทึกข้อมูล OTP ลงฐานข้อมูล
      await OTPVerification.findOneAndUpdate(
        { phoneNumber: formattedPhoneNumber },
        { 
          phoneNumber: formattedPhoneNumber,
          token: otpResponse.result.token,
          ref: otpResponse.result.ref,
          requestNo: otpResponse.result.requestNo,
          expiresAt,
          createdAt: new Date()
        },
        { upsert: true, new: true }
      );

      return NextResponse.json({
        success: true,
        message: 'ส่งรหัส OTP สำเร็จแล้ว กรุณาตรวจสอบข้อความ SMS',
        ref: otpResponse.result.ref  // ส่ง ref กลับไปให้แสดงบนหน้าเว็บ
      });
    } catch (error: any) {
      console.error('เกิดข้อผิดพลาดในการส่ง OTP:', error);
      return NextResponse.json(
        { success: false, message: `เกิดข้อผิดพลาดในการส่ง OTP: ${error.message}` },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('เกิดข้อผิดพลาดในการส่ง OTP:', error);
    return NextResponse.json(
      { success: false, message: 'เกิดข้อผิดพลาดในการส่ง OTP' },
      { status: 500 }
    );
  }
} 