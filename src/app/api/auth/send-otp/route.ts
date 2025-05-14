import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import OTPVerification from '@/models/OTPVerification';
import { requestOTP } from '@/utils/deesmsx';

// ตรวจสอบว่าเรากำลังอยู่ในโหมดพัฒนาหรือไม่
const isDevelopment = process.env.NODE_ENV === 'development';

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

    try {
      // เชื่อมต่อกับฐานข้อมูล
      await connectDB();

      // ตรวจสอบว่าเบอร์นี้เคยขอ OTP ไปแล้วหรือไม่
      const existingOtp = await OTPVerification.findOne({ phoneNumber: formattedPhoneNumber });
      if (existingOtp) {
        // ถ้ามีการขอ OTP ไปแล้ว ตรวจสอบว่าหมดอายุหรือยัง
        if (existingOtp.expiresAt > new Date()) {
          // ถ้ายังไม่หมดอายุให้รอจนกว่าจะหมดอายุ (ป้องกันการขอ OTP ถี่เกินไป)
          const timeRemaining = Math.ceil((existingOtp.expiresAt.getTime() - new Date().getTime()) / 1000);
          
          return NextResponse.json(
            { 
              success: false, 
              message: `กรุณารอ ${timeRemaining} วินาทีก่อนขอรหัส OTP ใหม่` 
            },
            { status: 429 }
          );
        } else {
          // ถ้าหมดอายุแล้ว ลบ OTP เก่าออก
          await OTPVerification.deleteOne({ _id: existingOtp._id });
        }
      }

      // ส่งคำขอ OTP ไปยัง DeeSMSx API
      const otpResponse = await requestOTP(formattedPhoneNumber);

      if (otpResponse.error !== '0') {
        return NextResponse.json(
          { success: false, message: otpResponse.msg || 'เกิดข้อผิดพลาดในการส่ง OTP' },
          { status: 500 }
        );
      }

      // เก็บข้อมูล OTP ลงฐานข้อมูล
      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + 5); // OTP หมดอายุใน 5 นาที

      await OTPVerification.create({
        phoneNumber: formattedPhoneNumber,
        token: otpResponse.result.token,
        ref: otpResponse.result.ref,
        expiresAt,
      });

      // สำหรับโหมดพัฒนา อาจจะส่ง ref มาด้วยเพื่อความสะดวก
      const response: { success: boolean; message: string; otp?: string } = {
        success: true,
        message: 'ส่งรหัส OTP ไปยังเบอร์โทรศัพท์ของคุณแล้ว',
      };

      if (isDevelopment) {
        // ในโหมดพัฒนาส่ง ref มาด้วยเพื่อความสะดวก (ไม่ควรทำในโหมด production)
        response.otp = otpResponse.result.ref;
      }

      return NextResponse.json(response);
    } catch (error: Error | unknown) {
      console.error('เกิดข้อผิดพลาดในการส่ง OTP:', error);
      const errorMessage = error instanceof Error ? error.message : 'เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ';
      
      return NextResponse.json(
        { success: false, message: `เกิดข้อผิดพลาดในการส่ง OTP: ${errorMessage}` },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('เกิดข้อผิดพลาดในการประมวลผลคำขอ:', error);
    
    return NextResponse.json(
      { success: false, message: 'เกิดข้อผิดพลาดในการประมวลผลคำขอ' },
      { status: 500 }
    );
  }
} 