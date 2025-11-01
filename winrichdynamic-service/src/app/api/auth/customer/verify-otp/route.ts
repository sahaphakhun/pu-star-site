import { NextResponse } from 'next/server';
import * as jose from 'jose';
import connectDB from '@/lib/mongodb';
import Customer from '@/models/Customer';
import User from '@/models/User';
import OTPVerification from '@/models/OTPVerification';
import { verifyOTP, formatPhoneNumber } from '@/utils/deesmsx';

export async function POST(req: Request) {
  try {
    const { customerCode, phoneNumber, otp } = await req.json();
    if (!customerCode || !phoneNumber || !otp) {
      return NextResponse.json({ success: false, message: 'กรุณาระบุรหัสลูกค้า เบอร์โทร และ OTP' }, { status: 400 });
    }
    const formatted = formatPhoneNumber(phoneNumber);
    if (!/^66\d{9}$/.test(formatted)) {
      return NextResponse.json({ success: false, message: 'รูปแบบเบอร์โทรศัพท์ไม่ถูกต้อง' }, { status: 400 });
    }

    await connectDB();
    const customer = await Customer.findOne({ customerCode: customerCode.toUpperCase() });
    if (!customer) return NextResponse.json({ success: false, message: 'ไม่พบรหัสลูกค้า' }, { status: 404 });
    const whitelist: string[] = Array.isArray((customer as any).authorizedPhones) ? (customer as any).authorizedPhones : [];
    if (!whitelist.includes(formatted)) {
      return NextResponse.json({ success: false, message: 'เบอร์นี้ไม่ได้รับอนุญาตให้เข้าสู่ระบบของลูกค้ารายนี้' }, { status: 403 });
    }

    const otpRecord = await OTPVerification.findOne({ phoneNumber: formatted });
    if (!otpRecord) return NextResponse.json({ success: false, message: 'กรุณาขอ OTP ใหม่' }, { status: 400 });
    if (otpRecord.expiresAt < new Date()) {
      await OTPVerification.deleteOne({ _id: otpRecord._id });
      return NextResponse.json({ success: false, message: 'OTP หมดอายุ โปรดขอใหม่' }, { status: 400 });
    }

    await verifyOTP(otpRecord.token, otp);
    await OTPVerification.deleteOne({ _id: otpRecord._id });

    // หรือลิงก์กับ User เดิม ถ้าไม่มีให้สร้าง user role=customer
    let user = await User.findOne({ phoneNumber: formatted });
    if (!user) {
      user = await User.create({ name: customer.name || 'ลูกค้า', phoneNumber: formatted, isVerified: true, role: 'customer' });
    } else {
      user.isVerified = true;
      await user.save();
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) return NextResponse.json({ success: false, message: 'ยังไม่ตั้งค่า JWT_SECRET' }, { status: 500 });

    const token = await new jose.SignJWT({ userId: String(user._id), phoneNumber: user.phoneNumber, role: user.role, customerId: String(customer._id), customerCode: customer.customerCode })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('7d')
      .sign(new TextEncoder().encode(secret));

    const res = NextResponse.json({ success: true, message: 'เข้าสู่ระบบสำเร็จ', customer: { id: String(customer._id), name: customer.name, code: customer.customerCode } });
    res.cookies.set({ name: 'token', value: token, httpOnly: true, maxAge: 60 * 60 * 24 * 7, path: '/', sameSite: 'strict', secure: process.env.NODE_ENV === 'production' });
    return res;
  } catch (error) {
    console.error('[Customer Auth] verify-otp error', error);
    return NextResponse.json({ success: false, message: 'ยืนยัน OTP ไม่สำเร็จ' }, { status: 400 });
  }
}

