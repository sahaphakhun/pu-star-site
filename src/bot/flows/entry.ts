import { showProducts, handleOrderPostback } from './product.flow';
import { callSendAPI } from '@/utils/messenger';
import { getSession, clearSession, updateSession } from '../state';
import { startAuth, handlePhone, handleOtp } from './auth.flow';
import { sendTypingOn } from '@/utils/messenger';
import { startCheckout, handleName, handleAddress, finalizeOrder } from './order.flow';

interface MessagingEvent {
  sender: { id: string };
  message?: {
    text?: string;
    quick_reply?: { payload: string };
  };
  postback?: {
    title?: string;
    payload?: string;
  };
  [key: string]: unknown;
}

const PAGE_ID = process.env.FB_PAGE_ID || '';

export async function handleEvent(event: MessagingEvent) {
  const psid = event.sender.id;

  // ถ้าผู้ส่งคือเพจเอง ไม่ต้องประมวลผลใด ๆ
  if (PAGE_ID && psid === PAGE_ID) {
    return;
  }

  // ข้าม event ที่เป็น echo (บอทส่งเอง) หรือ delivery/read
  if (event.message && ((event as any).message.is_echo || (event as any).message.app_id)) {
    //console.log('[Flow] skip echo');
    return;
  }
  if ((event as any).delivery || (event as any).read) {
    return;
  }

  console.log('[Flow] handleEvent for', psid, JSON.stringify(event));

  const session = getSession(psid);

  if (event.postback) {
    const payload = event.postback.payload || '';
    if (payload === 'GET_STARTED' || payload === 'SHOW_PRODUCTS') {
      return showProducts(psid);
    }
    if (payload.startsWith('ORDER_')) {
      return handleOrderPostback(psid, payload);
    }
    // ติดต่แอดมิน (ยังไม่ทำ handover ใน sprint 1)
    if (payload === 'CONTACT_ADMIN') {
      return callSendAPI(psid, { text: 'กำลังติดต่อแอดมิน โปรดรอสักครู่...' });
    }
  }

  if (event.message && event.message.quick_reply) {
    const payload = event.message.quick_reply.payload;
    if (payload === 'CONFIRM_CART') {
      return startCheckout(psid);
    }

    if (payload === 'ORDER_CONFIRM') {
      if (session.step === 'confirm_order') return finalizeOrder(psid);
    }

    if (payload === 'ORDER_CANCEL') {
      clearSession(psid);
      return callSendAPI(psid, { text: 'ยกเลิกคำสั่งซื้อแล้วค่ะ' });
    }

    if (session.step === 'await_phone' && event.message.quick_reply && (event.message.quick_reply as any).phone_number) {
      const phone = (event.message.quick_reply as any).phone_number;
      return handlePhone(psid, phone);
    }
  }

  // fallback
  if (event.message && event.message.text) {
    const txt = event.message.text.toLowerCase();

    if (txt.includes('#delete')) {
      clearSession(psid);
      await sendTypingOn(psid);
      return callSendAPI(psid, { text: 'ล้างประวัติการสนทนาแล้ว' });
    }

    if (session.step === 'await_otp') {
      if (/^\d{4,6}$/.test(txt)) {
        return handleOtp(psid, txt.trim());
      }
    }

    if (session.step === 'ask_name') {
      return handleName(psid, txt);
    }

    if (session.step === 'ask_address') {
      return handleAddress(psid, txt);
    }

    if (txt.includes('สวัสดี') || txt.includes('สวัสดีค่ะ') || txt.includes('hello')) {
      return showProducts(psid);
    }
  }

  // ถ้าไม่เข้าเงื่อนไขใด ส่งเมนูเริ่มต้น
  return showProducts(psid);
} 