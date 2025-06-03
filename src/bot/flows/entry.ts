import { showProducts, handleOrderPostback } from './product.flow';
import { callSendAPI } from '@/utils/messenger';
import { getSession } from '../state';

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
      const session = getSession(psid);
      const total = session.cart.reduce((s, i) => s + i.price * i.quantity, 0);
      return callSendAPI(psid, { text: `ยังไม่ implement การสั่งซื้ออัตโนมัติ (ยอด ${total.toLocaleString()} บาท)` });
    }
  }

  // fallback
  if (event.message && event.message.text) {
    const txt = event.message.text.toLowerCase();
    if (txt.includes('สวัสดี') || txt.includes('สวัสดีค่ะ') || txt.includes('hello')) {
      return callSendAPI(psid, { text: 'สวัสดีค่ะ เลือกดูสินค้าได้เลยนะคะ' });
    }
  }

  // ถ้าไม่เข้าเงื่อนไขใด ส่งเมนูเริ่มต้น
  return showProducts(psid);
} 