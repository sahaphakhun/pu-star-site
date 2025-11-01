import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import OTPVerification from '@/models/OTPVerification';
import { requestOTP } from '@/utils/deesmsx';
import { formatPhoneNumber, isValidPhoneNumber } from '@/utils/phoneUtils';

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

    // เชื่อมต่อกับฐานข้อมูล
    await connectDB();

    // ตรวจสอบว่าเบอร์นี้เคยขอ OTP ไปแล้วหรือไม่
    const existingOtp = await OTPVerification.findOne({ phoneNumber: formattedPhone });
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
            error: `กรุณารอ ${timeRemaining} วินาทีก่อนขอรหัส OTP ใหม่` 
          },
          { status: 429 }
        );
      } else {
        // ถ้าหมดอายุแล้ว ลบ OTP เก่าออก
        console.log('[B2B] OTP หมดอายุแล้ว กำลังลบออกจากฐานข้อมูล');
        await OTPVerification.deleteOne({ _id: existingOtp._id });
      }
    }

    // ส่งคำขอ OTP ผ่าน DeeSMSx
    try {
      const result = await requestOTP(formattedPhone);
      
      // ตรวจสอบผลลัพธ์จาก DeeSMSx
      const errorCode = result.error !== undefined ? result.error : result.code;
      if (String(errorCode) !== '0') {
        console.error('[B2B] DeeSMSx API ส่งค่า error กลับมา:', errorCode, result.msg);
        return NextResponse.json(
          { success: false, error: result.msg || 'เกิดข้อผิดพลาดในการส่ง OTP' },
          { status: 500 }
        );
      }

      // เก็บข้อมูล OTP ลงฐานข้อมูล
      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + 5); // OTP หมดอายุใน 5 นาที
      console.log('[B2B] กำลังบันทึกข้อมูล OTP ลงฐานข้อมูล');

      try {
        await OTPVerification.create({
          phoneNumber: formattedPhone,
          token: result.result.token,
          ref: result.result.ref,
          requestNo: result.result.requestNo,
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

      console.log(`[B2B] Registration OTP sent to ${formattedPhone}: ${result.result.ref}`);
      
      // สำหรับโหมดพัฒนา อาจจะส่ง ref มาด้วยเพื่อความสะดวก
      const response: { success: boolean; message: string; data: any; ref?: string } = {
        success: true,
        message: 'ส่ง OTP เรียบร้อยแล้ว',
        data: {
          phone: formattedPhone,
          expiresIn: '5 นาที'
        }
      };

      if (process.env.NODE_ENV === 'development') {
        // ในโหมดพัฒนาส่ง ref มาด้วยเพื่อความสะดวก (ไม่ควรทำในโหมด production)
        response.ref = result.result.ref;
        console.log('[B2B] โหมดพัฒนา ส่ง ref กลับไปด้วย:', result.result.ref);
      }

      return NextResponse.json(response);

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
