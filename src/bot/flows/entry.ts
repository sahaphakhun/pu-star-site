import { handleOrderPostback, showCategories, sendWelcome, handleCategoryPostback, askNextOption, askQuantity, addProductWithOptions, handleUnitPostback } from './product.flow';
import { callSendAPI } from '@/utils/messenger';
import { getSession, clearSession, updateSession, removeFromCart, adjustCartQuantity } from '../state';
import { startAuth, handlePhone, handleOtp } from './auth.flow';
import { sendTypingOn } from '@/utils/messenger';
import { startCheckout, handleName, handleAddress, handleNameAddress, finalizeOrder, askPayment, sendBankInfo, showCart, confirmCOD } from './order.flow';
import connectDB from '@/lib/db';
import AdminPhone from '@/models/AdminPhone';
import { sendSMS } from '@/app/notification';
import { getAssistantResponse, buildSystemInstructions, enableAIForUser, disableAIForUser, isAIEnabled } from '@/utils/openai-utils';

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
      return; // รอให้ผู้ใช้เลือกเมนูต่อไปจาก quick reply
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
    if (payload === 'CONTACT_ADMIN' || payload === 'CONTACT_ADMIN_INIT') {
      notifyAdminsContact(psid);
      return callSendAPI(psid, {
        text: 'สวัสดีค่ะ แอดมินอ๋อมแอ๋มยินดีให้บริการค่ะ',
        quick_replies: [
          { content_type: 'text', title: 'เมนูหลัก', payload: 'SHOW_MENU' },
        ],
      });
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

    // ยืนยันใช้ที่อยู่เดิม / ขอที่อยู่ใหม่
    if (payload === 'ADDR_USE_OLD' && session.step === 'confirm_old_address') {
      const { address, name } = (session.tempData || {}) as any;
      if (address) {
        return handleAddress(psid, address as string, name as string);
      }
    }

    if (payload === 'ADDR_NEW' && session.step === 'confirm_old_address') {
      await callSendAPI(psid, { text: 'กรุณาพิมพ์ชื่อและที่อยู่จัดส่ง เช่น:\nสมชาย ใจดี\n123/45 หมู่ 5 ต.บางใหญ่ ...' });
      await updateSession(psid, { step: 'await_name_address' });
      return;
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

    // เมนูดูสินค้า
    if (payload === 'SHOW_PRODUCTS') {
      await disableAIForUser(psid);
      return showCategories(psid);
    }

    // แสดงตะกร้าสินค้า
    if (payload === 'SHOW_CART') {
      return showCart(psid);
    }

    // ล้างตะกร้าสินค้า
    if (payload === 'CLEAR_CART') {
      await updateSession(psid, { cart: [] });
      await callSendAPI(psid, { text: 'ล้างตะกร้าแล้วค่ะ' });
      return showCategories(psid);
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

    // เพิ่ม/ลดจำนวนสินค้าในตะกร้า
    if (payload.startsWith('INC_QTY_')) {
      const idx = parseInt(payload.replace('INC_QTY_', ''), 10);
      if (!isNaN(idx)) {
        await adjustCartQuantity(psid, idx, 1);
      }
      return showCart(psid);
    }
    if (payload.startsWith('DEC_QTY_')) {
      const idx = parseInt(payload.replace('DEC_QTY_', ''), 10);
      if (!isNaN(idx)) {
        await adjustCartQuantity(psid, idx, -1);
      }
      return showCart(psid);
    }

    // เมนูเริ่มต้นจาก quick reply
    if (payload === 'Q_ORDER') {
      await disableAIForUser(psid);
      return showCategories(psid);
    }
    if (payload === 'SHOW_MENU') {
      await disableAIForUser(psid);
      return sendWelcome(psid);
    }
    if (payload === 'Q_CONTACT_ADMIN' || payload === 'CONTACT_ADMIN_INIT') {
      notifyAdminsContact(psid);
      return callSendAPI(psid, {
        text: 'สวัสดีค่ะ แอดมินอ๋อมแอ๋มยินดีให้บริการค่ะ',
        quick_replies: [
          { content_type: 'text', title: 'เมนูหลัก', payload: 'SHOW_MENU' },
        ],
      });
    }
    if (payload === 'Q_INQUIRY') {
      // เปิดโหมด AI ให้ตอบคำถามสินค้า
      await enableAIForUser(psid);
      await callSendAPI(psid, { text: 'กรุณาพิมพ์คำถามเกี่ยวกับสินค้า แล้วบอทจะตอบให้อัตโนมัติค่ะ' });
      return callSendAPI(psid, {
        text: 'หากต้องการเลือกดูสินค้า หรือกลับเมนูหลัก สามารถกดปุ่มด้านล่างได้เลยค่ะ',
        quick_replies: [
          { content_type: 'text', title: 'ดูสินค้า', payload: 'SHOW_PRODUCTS' },
          { content_type: 'text', title: 'เมนูหลัก', payload: 'SHOW_MENU' },
        ],
      });
    }

    if (payload === 'SHOP_ORDER') {
      return showCategories(psid);
    }

    if (payload === 'ASK_DETAILS') {
      return callSendAPI(psid, { text: 'กรุณาพิมพ์คำถามเกี่ยวกับสินค้าที่ต้องการสอบถามได้เลยค่ะ' });
    }

    // แก้ไขตะกร้า
    if (payload === 'EDIT_CART') {
      return callSendAPI(psid, {
        text: 'ต้องการแก้ไขส่วนใดของตะกร้าคะ?',
        quick_replies: [
          { content_type: 'text', title: 'จำนวน', payload: 'EDIT_QTY' },
          { content_type: 'text', title: 'สี', payload: 'EDIT_COLOR' },
          { content_type: 'text', title: 'แก้ไขสินค้า', payload: 'SHOW_PRODUCTS' },
        ],
      });
    }

    if (payload === 'EDIT_QTY') {
      return callSendAPI(psid, { text: 'กรุณาระบุหมายเลขสินค้าและจำนวนใหม่ เช่น 1 3' });
    }

    if (payload === 'EDIT_COLOR') {
      return callSendAPI(psid, { text: 'กรุณาระบุหมายเลขสินค้าและสีใหม่ที่ต้องการค่ะ' });
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
    // check AI mode first
    if (await isAIEnabled(psid)) {
      const question = event.message.text.trim();
      if (question.length > 0) {
        const answer = await getAssistantResponse(buildSystemInstructions('Basic'), [], question);
        await callSendAPI(psid, {
          text: answer,
          quick_replies: [
            { content_type: 'text', title: 'เมนูหลัก', payload: 'SHOW_MENU' },
            { content_type: 'text', title: 'ดูสินค้า', payload: 'SHOW_PRODUCTS' },
          ],
        });
        return;
      }
    }

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
      return; // รอการเลือกเมนูจากผู้ใช้
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

  // ถ้าไม่เข้าเงื่อนไขใด
  if (session.step === 'browse') {
    // ถือว่าเป็นการเริ่มต้นสนทนา
    return sendWelcome(psid);
  }
  // ค่าเริ่มต้น แสดงหมวดหมู่สินค้า
  return showCategories(psid);
}

// ฟังก์ชันแจ้งเตือนแอดมินผ่าน SMS เมื่อผู้ใช้กด "ติดต่อแอดมิน"
async function notifyAdminsContact(userPsid: string) {
  try {
    await connectDB();
    const adminList = await AdminPhone.find({}, 'phoneNumber').lean();
    if (!adminList || adminList.length === 0) {
      console.warn('[notifyAdminsContact] ไม่พบเบอร์โทรแอดมินในระบบ');
      return;
    }
    const msg = `มีลูกค้ากด \"ติดต่อแอดมิน\" (PSID: ${userPsid}) ผ่านเพจ Facebook กรุณาตอบกลับค่ะ`;
    await Promise.allSettled(
      adminList.map((a: any) => sendSMS(a.phoneNumber, msg))
    );
  } catch (err) {
    console.error('[notifyAdminsContact] error', err);
  }
} 