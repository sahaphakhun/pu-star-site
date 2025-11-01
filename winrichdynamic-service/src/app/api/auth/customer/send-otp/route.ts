import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Customer from '@/models/Customer';
import OTPVerification from '@/models/OTPVerification';
import { requestOTP, formatPhoneNumber } from '@/utils/deesmsx';

const SENDER_NAME = process.env.DEESMSX_SENDER_NAME || 'deeSMS.OTP';

export async function POST(req: Request) {
  try {
    const { customerCode, phoneNumber } = await req.json();
    if (!customerCode || !phoneNumber) {
      return NextResponse.json({ success: false, message: 'กรุณาระบุรหัสลูกค้าและเบอร์โทรศัพท์' }, { status: 400 });
    }

    const formatted = formatPhoneNumber(phoneNumber);
    if (!/^66\d{9}$/.test(formatted)) {
      return NextResponse.json({ success: false, message: 'รูปแบบเบอร์โทรศัพท์ไม่ถูกต้อง' }, { status: 400 });
    }

    await connectDB();
    const customer = await Customer.findOne({ customerCode: customerCode.toUpperCase() }).lean();
    if (!customer) {
      return NextResponse.json({ success: false, message: 'ไม่พบรหัสลูกค้านี้' }, { status: 404 });
    }
    const whitelist: string[] = Array.isArray((customer as any).authorizedPhones) ? (customer as any).authorizedPhones : [];
    if (!whitelist.includes(formatted)) {
      return NextResponse.json({ success: false, message: 'เบอร์นี้ไม่ได้รับอนุญาตให้เข้าสู่ระบบของลูกค้ารายนี้' }, { status: 403 });
    }

    // Clear existing unexpired entry to allow new send
    const exists = await OTPVerification.findOne({ phoneNumber: formatted });
    if (exists && exists.expiresAt > new Date()) {
      const timeRemaining = Math.ceil((exists.expiresAt.getTime() - Date.now()) / 1000);
      return NextResponse.json({ success: false, message: `กรุณารอ ${timeRemaining} วินาทีก่อนขอรหัสใหม่` }, { status: 429 });
    } else if (exists) {
      await OTPVerification.deleteOne({ _id: exists._id });
    }

    const otpResponse = await requestOTP(formatted, SENDER_NAME);
    const errorCode = otpResponse.error !== undefined ? otpResponse.error : otpResponse.code;
    if (String(errorCode) !== '0') {
      return NextResponse.json({ success: false, message: otpResponse.msg || 'ส่ง OTP ไม่สำเร็จ' }, { status: 500 });
    }

    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);
    await OTPVerification.create({
      phoneNumber: formatted,
      token: otpResponse.result.token,
      ref: otpResponse.result.ref,
      requestNo: otpResponse.result.requestNo,
      expiresAt,
    });

    return NextResponse.json({ success: true, message: 'ส่งรหัส OTP แล้ว' });
  } catch (error) {
    console.error('[Customer Auth] send-otp error', error);
    return NextResponse.json({ success: false, message: 'เกิดข้อผิดพลาด' }, { status: 500 });
  }
}

