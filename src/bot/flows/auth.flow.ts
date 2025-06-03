import { sendTypingOn, callSendAPI } from '@/utils/messenger';
import { requestOTP, verifyOTP } from '@/utils/deesmsx';
import connectDB from '@/lib/mongodb';
import MessengerUser from '@/models/MessengerUser';
import User from '@/models/User';
import { updateSession } from '../state';

export async function startAuth(psid: string) {
  await sendTypingOn(psid);
  await callSendAPI(psid, {
    text: 'กรุณาแชร์เบอร์โทรศัพท์ของคุณค่ะ',
    quick_replies: [
      { content_type: 'user_phone_number' },
    ],
  });
  updateSession(psid, { step: 'await_phone' });
}

export async function handlePhone(psid: string, phone: string) {
  await connectDB();
  const otpResp = await requestOTP(phone);
  const token = otpResp?.result?.token;
  if (!token) {
    await callSendAPI(psid, { text: 'ขอรหัส OTP ไม่สำเร็จ กรุณาลองใหม่' });
    return;
  }
  await MessengerUser.findOneAndUpdate(
    { psid },
    { psid, phoneNumber: phone, otpToken: token, otpExpire: new Date(Date.now() + 5 * 60 * 1000) },
    { upsert: true }
  );
  await callSendAPI(psid, { text: 'กรุณากรอก OTP 6 หลักที่ได้รับค่ะ' });
  updateSession(psid, { step: 'await_otp' });
}

export async function handleOtp(psid: string, otp: string) {
  await connectDB();
  const mu = await MessengerUser.findOne({ psid });
  if (!mu || !mu.otpToken) {
    return callSendAPI(psid, { text: 'ไม่พบคำขอ OTP กรุณาเริ่มใหม่พิมพ์ #delete' });
  }
  try {
    await verifyOTP(mu.otpToken, otp);
  } catch {
    return callSendAPI(psid, { text: 'OTP ไม่ถูกต้อง กรุณาลองใหม่' });
  }
  // create or find user
  let user = await User.findOne({ phoneNumber: mu.phoneNumber });
  if (!user) {
    user = await User.create({ name: 'ลูกค้า', phoneNumber: mu.phoneNumber, role: 'user', isVerified: true });
  }
  mu.userId = user._id;
  mu.otpToken = undefined;
  mu.otpExpire = undefined;
  await mu.save();
  await callSendAPI(psid, { text: 'ยืนยันตัวตนสำเร็จค่ะ สามารถดำเนินการสั่งซื้อได้เลย' });
  updateSession(psid, { step: 'browse' });
} 