import { handleOrderPostback, showCategories, sendWelcome, handleCategoryPostback, askNextOption, askQuantity, addProductWithOptions, handleUnitPostback } from './product.flow';
import { callSendAPI } from '@/utils/messenger';
import { getSession, clearSession, updateSession, removeFromCart } from '../state';
import { startAuth, handlePhone, handleOtp } from './auth.flow';
import { sendTypingOn } from '@/utils/messenger';
import { startCheckout, handleName, handleAddress, handleNameAddress, finalizeOrder, askPayment, sendBankInfo, showCart, confirmCOD } from './order.flow';

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
        return confirmCOD(psid);
      }
    }

    if (payload === 'COD_CONFIRM') {
      if (session.step === 'await_cod_confirm') {
        return finalizeOrder(psid);
      }
    }

    if (payload === 'CHANGE_PAYMENT') {
      // รีเซ็ต paymentMethod แล้วถามใหม่ ไม่ว่ากำลังอยู่ขั้นไหน
      await updateSession(psid, { tempData: { ...(session.tempData || {}), paymentMethod: undefined } });
      return askPayment(psid);
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

    // แสดงตะกร้าสินค้า
    if (payload === 'SHOW_CART') {
      return showCart(psid);
    }

    // ล้างตะกร้าสินค้า
    if (payload === 'CLEAR_CART') {
      await updateSession(psid, { cart: [] });
      return callSendAPI(psid, { text: 'ล้างตะกร้าแล้วค่ะ' });
    }

    // ลบรายการล่าสุดหรือตาม index
    if (payload === 'REMOVE_LAST') {
      await removeFromCart(psid);
      return showCart(psid);
    }
    if (payload.startsWith('REMOVE_')) {
      const idx = parseInt(payload.replace('REMOVE_', ''), 10);
      if (!isNaN(idx)) {
        await removeFromCart(psid, idx);
        return showCart(psid);
      }
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

    // ผู้ใช้พิมพ์เบอร์โทรด้วยตัวเอง (ไม่ใช้ quick reply)
    if (session.step === 'await_phone') {
      const digits = txt.replace(/\D/g, '');
      if (digits.length >= 8 && digits.length <= 12) {
        return handlePhone(psid, digits);
      }
    }

    if (session.step === 'await_otp') {
      if (/^\d{4,6}$/.test(txt)) {
        return handleOtp(psid, txt.trim());
      }
    }

    if (session.step === 'await_name_address') {
      return handleNameAddress(psid, event.message.text);
    }

    if (txt.includes('สวัสดี') || txt.includes('สวัสดีค่ะ') || txt.includes('hello')) {
      await sendWelcome(psid);
      return showCategories(psid);
    }
  }

  // หากกำลังถามจำนวนและผู้ใช้พิมพ์ตัวเลขเอง
  if (event.message && session.step === 'ask_quantity' && event.message.text) {
    const qtyNum = parseInt(event.message.text.replace(/[^0-9]/g, ''), 10);
    if (!isNaN(qtyNum) && qtyNum > 0 && qtyNum <= 1000) {
      await addProductWithOptions(psid, qtyNum);
      return;
    }
    // แจ้งเตือนหากป้อนผิด
    await callSendAPI(psid, { text: 'กรุณาพิมพ์ตัวเลขเท่านั้น เช่น 3' });
    return;
  }

  // ยืนยันใช้ที่อยู่เดิม
  if (payload === 'ADDR_USE_OLD' && session.step === 'confirm_old_address') {
    const { address, name } = (session.tempData || {}) as any;
    if (address) {
      return handleAddress(psid, address as string, name as string);
    }
  }

  if (payload === 'ADDR_NEW' && session.step === 'confirm_old_address') {
    await callSendAPI(psid, { text: 'กรุณาพิมพ์ชื่อและที่อยู่จัดส่ง เช่น:\nสมชาย ใจดี\n123/45 หมู่ 5 ต.บางรัก ...' });
    await updateSession(psid, { step: 'await_name_address' });
    return;
  }

  // ถ้าไม่เข้าเงื่อนไขใด ส่งเมนูเริ่มต้น
  return showCategories(psid);
} 