import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import OTPVerification from '@/models/OTPVerification';
import { requestOTP, formatPhoneNumber } from '@/utils/deesmsx';

// ตรวจสอบว่าเรากำลังอยู่ในโหมดพัฒนาหรือไม่
const isDevelopment = process.env.NODE_ENV === 'development';

// ใช้ sender ที่ได้รับอนุมัติ
const SENDER_NAME = process.env.DEESMSX_SENDER_NAME || 'deeSMS.OTP';

// API Handler สำหรับส่ง OTP
export async function POST(req: Request) {
  try {
    const { phoneNumber } = await req.json();
    console.log('[B2B] ได้รับคำขอส่ง OTP สำหรับเบอร์:', phoneNumber);

    if (!phoneNumber) {
      console.log('[B2B] ไม่ได้ระบุเบอร์โทรศัพท์');
      return NextResponse.json(
        { success: false, message: 'กรุณาระบุเบอร์โทรศัพท์' },
        { status: 400 }
      );
    }

    // แปลงและตรวจสอบเบอร์โทรศัพท์ให้เป็นรูปแบบ E.164 (66xxxxxxxxx)
    const formattedPhoneNumber = formatPhoneNumber(phoneNumber);

    // หากไม่ตรงตามรูปแบบ 66 + 9 หลัก ให้แจ้งข้อผิดพลาด
    if (!/^66\d{9}$/.test(formattedPhoneNumber)) {
      console.log('[B2B] รูปแบบเบอร์โทรศัพท์ไม่ถูกต้อง:', phoneNumber, '→', formattedPhoneNumber);
      return NextResponse.json(
        { success: false, message: 'รูปแบบเบอร์โทรศัพท์ไม่ถูกต้อง' },
        { status: 400 }
      );
    }

    console.log('[B2B] เบอร์โทรศัพท์หลังจากแปลง:', formattedPhoneNumber);

    try {
      // เชื่อมต่อกับฐานข้อมูล
      console.log('[B2B] กำลังเชื่อมต่อกับฐานข้อมูล...');
      await connectDB();
      console.log('[B2B] เชื่อมต่อกับฐานข้อมูลสำเร็จ');

      // ตรวจสอบว่าเบอร์นี้เคยขอ OTP ไปแล้วหรือไม่
      const existingOtp = await OTPVerification.findOne({ phoneNumber: formattedPhoneNumber });
      if (existingOtp) {
        console.log('[B2B] พบ OTP เดิมสำหรับเบอร์นี้:', existingOtp);
        // ถ้ามีการขอ OTP ไปแล้ว ตรวจสอบว่าหมดอายุหรือยัง
        if (existingOtp.expiresAt > new Date()) {
          // ถ้ายังไม่หมดอายุให้รอจนกว่าจะหมดอายุ (ป้องกันการขอ OTP ถี่เกินไป)
          const timeRemaining = Math.ceil((existingOtp.expiresAt.getTime() - new Date().getTime()) / 1000);
          console.log('[B2B] OTP ยังไม่หมดอายุ เหลือเวลาอีก:', timeRemaining, 'วินาที');
          
          return NextResponse.json(
            { 
              success: false, 
              message: `กรุณารอ ${timeRemaining} วินาทีก่อนขอรหัส OTP ใหม่` 
            },
            { status: 429 }
          );
        } else {
          // ถ้าหมดอายุแล้ว ลบ OTP เก่าออก
          console.log('[B2B] OTP หมดอายุแล้ว กำลังลบออกจากฐานข้อมูล');
          await OTPVerification.deleteOne({ _id: existingOtp._id });
        }
      }

      // ส่งคำขอ OTP ไปยัง DeeSMSx API
      console.log('[B2B] กำลังส่งคำขอ OTP ไปยัง DeeSMSx API ด้วย Sender:', SENDER_NAME);
      const otpResponse = await requestOTP(formattedPhoneNumber, SENDER_NAME);
      console.log('[B2B] ได้รับการตอบกลับจาก DeeSMSx API:', otpResponse);

      const errorCode = otpResponse.error !== undefined ? otpResponse.error : otpResponse.code;
      if (String(errorCode) !== '0') {
        console.error('[B2B] DeeSMSx API ส่งค่า error กลับมา:', errorCode, otpResponse.msg);
        return NextResponse.json(
          { success: false, message: otpResponse.msg || 'เกิดข้อผิดพลาดในการส่ง OTP' },
          { status: 500 }
        );
      }

      // เก็บข้อมูล OTP ลงฐานข้อมูล
      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + 5); // OTP หมดอายุใน 5 นาที
      console.log('[B2B] กำลังบันทึกข้อมูล OTP ลงฐานข้อมูล');

      try {
        await OTPVerification.create({
          phoneNumber: formattedPhoneNumber,
          token: otpResponse.result.token,
          ref: otpResponse.result.ref,
          requestNo: otpResponse.result.requestNo,
          expiresAt,
        });
        console.log('[B2B] บันทึกข้อมูล OTP สำเร็จ');
      } catch (dbError) {
        console.error('[B2B] เกิดข้อผิดพลาดในการบันทึกข้อมูล OTP:', dbError);
        if (dbError instanceof Error) {
          console.error('[B2B] Error message:', dbError.message);
          console.error('[B2B] Error stack:', dbError.stack);
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
        console.log('[B2B] โหมดพัฒนา ส่ง ref กลับไปด้วย:', otpResponse.result.ref);
      }

      return NextResponse.json(response);
    } catch (error: Error | unknown) {
      console.error('[B2B] เกิดข้อผิดพลาดในการส่ง OTP:', error);
      if (error instanceof Error) {
        console.error('[B2B] Error message:', error.message);
        console.error('[B2B] Error stack:', error.stack);
      }
      
      const errorMessage = error instanceof Error ? error.message : 'เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ';
      
      // หากข้อความแสดงว่าเพิ่งส่งไปแล้ว ให้แจ้งให้รอ 30 วินาที
      if (errorMessage.includes('Unable to update information')) {
        return NextResponse.json(
          {
            success: false,
            message: 'กรุณารอ 30 วินาทีก่อนส่งรหัส OTP ใหม่',
          },
          { status: 429 }
        );
      }

      return NextResponse.json(
        { success: false, message: `เกิดข้อผิดพลาดในการส่ง OTP: ${errorMessage}` },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('[B2B] เกิดข้อผิดพลาดในการประมวลผลคำขอ:', error);
    if (error instanceof Error) {
      console.error('[B2B] Error message:', error.message);
      console.error('[B2B] Error stack:', error.stack);
    }
    
    return NextResponse.json(
      { success: false, message: 'เกิดข้อผิดพลาดในการประมวลผลคำขอ' },
      { status: 500 }
    );
  }
}
