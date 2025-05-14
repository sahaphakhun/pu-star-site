import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import OTPVerification from '@/models/OTPVerification';
import { requestOTP } from '@/utils/deesmsx';

// ตรวจสอบว่าเรากำลังอยู่ในโหมดพัฒนาหรือไม่
const isDevelopment = process.env.NODE_ENV === 'development';

// ใช้ sender ที่ได้รับอนุมัติ
const SENDER_NAME = process.env.DEESMSX_SENDER_NAME || 'deeSMSX';

// API Handler สำหรับส่ง OTP
export async function POST(req: Request) {
  try {
    const { phoneNumber } = await req.json();
    console.log('ได้รับคำขอส่ง OTP สำหรับเบอร์:', phoneNumber);

    if (!phoneNumber) {
      console.log('ไม่ได้ระบุเบอร์โทรศัพท์');
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
      console.log('รูปแบบเบอร์โทรศัพท์ไม่ถูกต้อง:', phoneNumber);
      return NextResponse.json(
        { success: false, message: 'รูปแบบเบอร์โทรศัพท์ไม่ถูกต้อง' },
        { status: 400 }
      );
    }

    console.log('เบอร์โทรศัพท์หลังจากแปลง:', formattedPhoneNumber);

    try {
      // เชื่อมต่อกับฐานข้อมูล
      console.log('กำลังเชื่อมต่อกับฐานข้อมูล...');
      await connectDB();
      console.log('เชื่อมต่อกับฐานข้อมูลสำเร็จ');

      // ตรวจสอบว่าเบอร์นี้เคยขอ OTP ไปแล้วหรือไม่
      const existingOtp = await OTPVerification.findOne({ phoneNumber: formattedPhoneNumber });
      if (existingOtp) {
        console.log('พบ OTP เดิมสำหรับเบอร์นี้:', existingOtp);
        // ถ้ามีการขอ OTP ไปแล้ว ตรวจสอบว่าหมดอายุหรือยัง
        if (existingOtp.expiresAt > new Date()) {
          // ถ้ายังไม่หมดอายุให้รอจนกว่าจะหมดอายุ (ป้องกันการขอ OTP ถี่เกินไป)
          const timeRemaining = Math.ceil((existingOtp.expiresAt.getTime() - new Date().getTime()) / 1000);
          console.log('OTP ยังไม่หมดอายุ เหลือเวลาอีก:', timeRemaining, 'วินาที');
          
          return NextResponse.json(
            { 
              success: false, 
              message: `กรุณารอ ${timeRemaining} วินาทีก่อนขอรหัส OTP ใหม่` 
            },
            { status: 429 }
          );
        } else {
          // ถ้าหมดอายุแล้ว ลบ OTP เก่าออก
          console.log('OTP หมดอายุแล้ว กำลังลบออกจากฐานข้อมูล');
          await OTPVerification.deleteOne({ _id: existingOtp._id });
        }
      }

      // ส่งคำขอ OTP ไปยัง DeeSMSx API
      console.log('กำลังส่งคำขอ OTP ไปยัง DeeSMSx API ด้วย Sender:', SENDER_NAME);
      const otpResponse = await requestOTP(formattedPhoneNumber, SENDER_NAME);
      console.log('ได้รับการตอบกลับจาก DeeSMSx API:', otpResponse);

      if (otpResponse.error !== '0') {
        console.error('DeeSMSx API ส่งค่า error กลับมา:', otpResponse.error, otpResponse.msg);
        return NextResponse.json(
          { success: false, message: otpResponse.msg || 'เกิดข้อผิดพลาดในการส่ง OTP' },
          { status: 500 }
        );
      }

      // เก็บข้อมูล OTP ลงฐานข้อมูล
      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + 5); // OTP หมดอายุใน 5 นาที
      console.log('กำลังบันทึกข้อมูล OTP ลงฐานข้อมูล');

      try {
        await OTPVerification.create({
          phoneNumber: formattedPhoneNumber,
          token: otpResponse.result.token,
          ref: otpResponse.result.ref,
          requestNo: otpResponse.result.requestNo,
          expiresAt,
        });
        console.log('บันทึกข้อมูล OTP สำเร็จ');
      } catch (dbError) {
        console.error('เกิดข้อผิดพลาดในการบันทึกข้อมูล OTP:', dbError);
        if (dbError instanceof Error) {
          console.error('Error message:', dbError.message);
          console.error('Error stack:', dbError.stack);
        }
        throw dbError;
      }

      // สำหรับโหมดพัฒนา อาจจะส่ง ref มาด้วยเพื่อความสะดวก
      const response: { success: boolean; message: string; otp?: string } = {
        success: true,
        message: 'ส่งรหัส OTP ไปยังเบอร์โทรศัพท์ของคุณแล้ว',
      };

      if (isDevelopment) {
        // ในโหมดพัฒนาส่ง ref มาด้วยเพื่อความสะดวก (ไม่ควรทำในโหมด production)
        response.otp = otpResponse.result.ref;
        console.log('โหมดพัฒนา ส่ง ref กลับไปด้วย:', otpResponse.result.ref);
      }

      return NextResponse.json(response);
    } catch (error: Error | unknown) {
      console.error('เกิดข้อผิดพลาดในการส่ง OTP:', error);
      if (error instanceof Error) {
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
      }
      
      const errorMessage = error instanceof Error ? error.message : 'เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ';
      
      return NextResponse.json(
        { success: false, message: `เกิดข้อผิดพลาดในการส่ง OTP: ${errorMessage}` },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('เกิดข้อผิดพลาดในการประมวลผลคำขอ:', error);
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
    
    return NextResponse.json(
      { success: false, message: 'เกิดข้อผิดพลาดในการประมวลผลคำขอ' },
      { status: 500 }
    );
  }
} 