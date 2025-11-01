import { sendTypingOn, callSendAPI } from '@/utils/messenger';
import { requestOTP, verifyOTP, formatPhoneNumber } from '@/utils/deesmsx';
import connectDB from '@/lib/mongodb';
import MessengerUser from '@/models/MessengerUser';
import User from '@/models/User';
import Order from '@/models/Order';
import { updateSession } from '../state';
import { sendWelcome } from './product.flow';
import { syncUserNameFromFirstOrder } from '@/utils/userNameSync';

export async function startAuth(psid: string) {
  await sendTypingOn(psid);
  await callSendAPI(psid, {
    text: 'กรุณากดแชร์หรือส่งเบอร์โทรศัพท์ของคุณค่ะ',
    quick_replies: [
      { content_type: 'user_phone_number' },
    ],
  });
  await updateSession(psid, { step: 'await_phone' });
}

export async function handlePhone(psid: string, phone: string) {
  await connectDB();
  const normalized = formatPhoneNumber(phone);
  const otpResp = await requestOTP(normalized);
  const token = otpResp?.result?.token;
  if (!token) {
    await callSendAPI(psid, { text: 'ขอรหัส OTP ไม่สำเร็จ กรุณาลองใหม่' });
    return;
  }
  await MessengerUser.findOneAndUpdate(
    { psid },
    { psid, phoneNumber: normalized, otpToken: token, otpExpire: new Date(Date.now() + 5 * 60 * 1000) },
    { upsert: true }
  );
  await callSendAPI(psid, { text: 'กรุณากรอก OTP 6 หลักที่ได้รับค่ะ' });
  await updateSession(psid, { step: 'await_otp' });
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
    
    // พยายามซิงค์ชื่อจากออเดอร์ที่มีอยู่แล้ว (กรณีผู้ใช้เก่า)
    const userId = user._id.toString();
    setTimeout(async () => {
      try {
        await syncUserNameFromFirstOrder(userId);
      } catch (error) {
        console.log('ไม่สามารถซิงค์ชื่อได้:', error);
      }
    }, 1000);
  } else {
    // สำหรับผู้ใช้ที่มีอยู่แล้ว ให้ตรวจสอบและซิงค์ชื่อหากจำเป็น
    const userId = user._id.toString();
    setTimeout(async () => {
      try {
        await syncUserNameFromFirstOrder(userId);
      } catch (error) {
        console.log('ไม่สามารถซิงค์ชื่อได้:', error);
      }
    }, 1000);
  }
  
  // ตรวจสอบว่า user ถูกสร้างหรือค้นพบสำเร็จ
  if (!user) {
    return callSendAPI(psid, { text: 'เกิดข้อผิดพลาดในการสร้างผู้ใช้ กรุณาลองใหม่' });
  }
  
  mu.userId = user._id;
  mu.otpToken = undefined;
  mu.otpExpire = undefined;
  await mu.save();
  
  await callSendAPI(psid, { text: 'ยืนยันตัวตนสำเร็จแล้วค่ะ ตอนนี้คุณสามารถรับการแจ้งเตือนได้แล้วค่ะ' });
  
  // แสดงเมนูเริ่มต้นสี่เมนูเหมือนตอนเริ่มสนทนา
  await sendWelcome(psid);
  
  // รีเซ็ต session
  await updateSession(psid, { step: 'welcome' });
}
