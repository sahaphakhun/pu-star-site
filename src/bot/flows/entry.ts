import { handleOrderPostback, showCategories, sendWelcome, handleCategoryPostback, askNextOption, askQuantity, addProductWithOptions, handleUnitPostback } from './product.flow';
import { callSendAPI } from '@/utils/messenger';
import { getSession, clearSession, updateSession } from '../state';
import { startAuth, handlePhone, handleOtp } from './auth.flow';
import { sendTypingOn } from '@/utils/messenger';
import { startCheckout, handleName, handleAddress, finalizeOrder, askPayment, sendBankInfo } from './order.flow';

interface MessagingEvent {
  sender: { id: string };
  message?: {
    text?: string;
    quick_reply?: { payload: string };
    attachments?: { type: string; payload: any }[];
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

  const session = await getSession(psid);

  if (event.postback) {
    const payload = event.postback.payload || '';
    if (payload === 'GET_STARTED') {
      await sendWelcome(psid);
      return showCategories(psid);
    }
    if (payload === 'SHOW_PRODUCTS') {
      return showCategories(psid);
    }
    if (payload.startsWith('CATEGORY_')) {
      return handleCategoryPostback(psid, payload);
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
      if (session.step === 'ask_payment') {
        // ถัดไปเลือกวิธีชำระเงิน
        return askPayment(psid);
      }
    }

    if (payload === 'ORDER_CANCEL') {
      await clearSession(psid);
      return callSendAPI(psid, { text: 'ยกเลิกคำสั่งซื้อแล้วค่ะ' });
    }

    if (payload === 'PAY_TRANSFER') {
      if (session.step === 'await_payment_method') {
        await updateSession(psid, { tempData: { ...(session.tempData || {}), paymentMethod: 'transfer' } });
        return sendBankInfo(psid);
      }
    }

    if (payload === 'PAY_COD') {
      if (session.step === 'await_payment_method') {
        await updateSession(psid, { tempData: { ...(session.tempData || {}), paymentMethod: 'cod' } });
        return finalizeOrder(psid);
      }
    }

    if (session.step === 'await_phone' && event.message.quick_reply && (event.message.quick_reply as any).phone_number) {
      const phone = (event.message.quick_reply as any).phone_number;
      return handlePhone(psid, phone);
    }

    // เลือกตัวเลือกสินค้า
    if (payload.startsWith('OPT_') && session.step === 'select_option') {
      const [, idxStr, encoded] = payload.split('_');
      const valueLabel = decodeURIComponent(encoded);
      const idx = parseInt(idxStr, 10);
      const temp: any = session.tempData || {};
      const product = temp.product;
      const option = product.options[idx];
      temp.selections = { ...(temp.selections || {}), [option.name]: valueLabel };
      temp.optIdx = idx + 1;
      await updateSession(psid, { tempData: temp });

      if (temp.optIdx < product.options.length) {
        return askNextOption(psid);
      }
      // ถามจำนวนต่อ
      return askQuantity(psid);
    }

    // เลือกจำนวน
    if (payload.startsWith('QTY_') && session.step === 'ask_quantity') {
      const qty = parseInt(payload.replace('QTY_', ''), 10) || 1;
      await addProductWithOptions(psid, qty);
      return;
    }

    // เลือกหน่วยสินค้า
    if (payload.startsWith('UNIT_') && session.step === 'select_unit') {
      return await handleUnitPostback(psid, payload);
    }
  }

  // รับสลิปเป็นรูปภาพ
  if (event.message && session.step === 'await_slip' && event.message.attachments && event.message.attachments.length > 0) {
    const img = event.message.attachments[0];
    if (img.type === 'image' && img.payload && (img.payload as any).url) {
      const slipUrl = (img.payload as any).url as string;
      await updateSession(psid, { tempData: { ...(session.tempData || {}), slipUrl } });
      return finalizeOrder(psid);
    }
  }

  // fallback
  if (event.message && event.message.text) {
    const txt = event.message.text.toLowerCase();

    if (txt.includes('#delete')) {
      await clearSession(psid);
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
      await sendWelcome(psid);
      return showCategories(psid);
    }
  }

  // ถ้าไม่เข้าเงื่อนไขใด ส่งเมนูเริ่มต้น
  return showCategories(psid);
} 