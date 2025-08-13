import { showCategories, sendWelcome, handleCategoryPostback, askNextOption, askQuantity, addProductWithOptions, handleUnitPostback } from './product.flow';
import { callSendAPI } from '@/utils/messenger';
import { getSession, clearSession, updateSession, removeFromCart, incrementNonMenuMessageCount, resetNonMenuMessageCount } from '../state';
import { startAuth, handlePhone, handleOtp } from './auth.flow';
import { sendTypingOn } from '@/utils/messenger';
import { startCheckout, handleName, handleAddress, handleNameAddress, finalizeOrder, askPayment, sendBankInfo, showCart, confirmCOD, askColorOptions, handleSavedAddressSelection, promptNewAddress, handleDeliveryMethod, handleLalamoveLocation, handleCoordinatesText } from './order.flow';
import { showMyOrders } from './orderHistory.flow';
import connectDB from '@/lib/db';
import AdminPhone from '@/models/AdminPhone';
import { sendSMS } from '@/app/notification';
import { getAssistantResponse, buildSystemInstructions, enableAIForUser, disableAIForUser, isAIEnabled, enableAutoModeForUser, isAutoModeEnabled, addToConversationHistory, getConversationHistory, enableAutoModeAndRespond } from '@/utils/openai-utils';
import MessengerUser from '@/models/MessengerUser';
import { sendSmartMessage, hasCutOrImageCommands } from '@/utils/messenger-utils';

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
    
    // รีเซ็ตจำนวนข้อความที่ไม่ใช่เมนูเมื่อกดเมนู
    await resetNonMenuMessageCount(psid);
    
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
    if (payload === 'CONTACT_ADMIN' || payload === 'CONTACT_ADMIN_INIT') {
      notifyAdminsContact(psid);
      return callSendAPI(psid, {
        text: 'สวัสดีค่ะ แอดมินอ๋อมแอ๋มยินดีให้บริการค่ะ',
        quick_replies: [
          { content_type: 'text', title: 'เมนูหลัก', payload: 'SHOW_MENU' },
        ],
      });
    }

    // จัดการปุ่มจากการ์ดตะกร้า (+ / - / เปลี่ยนสี)
    if (payload.startsWith('INC_QTY_')) {
      const idx = parseInt(payload.replace('INC_QTY_', ''), 10);
      if (!isNaN(idx) && session.cart[idx]) {
        session.cart[idx].quantity += 1;
        await updateSession(psid, { cart: session.cart });
      }
      return showCart(psid);
    }

    if (payload.startsWith('DEC_QTY_')) {
      const idx = parseInt(payload.replace('DEC_QTY_', ''), 10);
      if (!isNaN(idx) && session.cart[idx]) {
        session.cart[idx].quantity -= 1;
        if (session.cart[idx].quantity <= 0) {
          session.cart.splice(idx, 1);
        }
        await updateSession(psid, { cart: session.cart });
      }
      return showCart(psid);
    }

    if (payload.startsWith('EDIT_COL_')) {
      const idx = parseInt(payload.replace('EDIT_COL_', ''), 10);
      if (!isNaN(idx)) {
        return askColorOptions(psid, idx);
      }
    }

    // จัดการปุ่มเปลี่ยนจำนวน (เวอร์ชันใหม่)
    if (payload.startsWith('EDIT_QTY_')) {
      const idx = parseInt(payload.replace('EDIT_QTY_', ''), 10);
      if (!isNaN(idx) && session.cart[idx]) {
        const item = session.cart[idx];
        // บันทึก index ไว้ใน tempData เพื่อใช้ตอนผู้ใช้พิมพ์จำนวนใหม่
        await updateSession(psid, {
          step: 'await_new_qty',
          tempData: { ...(session.tempData || {}), editIdx: idx },
        });
        return callSendAPI(psid, { text: `พิมพ์จำนวนใหม่สำหรับ "${item.name}" ได้เลยค่ะ (จำนวนปัจจุบัน ${item.quantity})` });
      }
    }
  }

  if (event.message && event.message.quick_reply) {
    const payload = event.message.quick_reply.payload;
    
    // รีเซ็ตจำนวนข้อความที่ไม่ใช่เมนูเมื่อกดเมนู
    await resetNonMenuMessageCount(psid);
    
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

    // Delivery method selection
    if (payload === 'DELIVERY_STANDARD') {
      if (session.step === 'ask_delivery_method') {
        return handleDeliveryMethod(psid, 'standard');
      }
    }

    if (payload === 'DELIVERY_LALAMOVE') {
      if (session.step === 'ask_delivery_method') {
        return handleDeliveryMethod(psid, 'lalamove');
      }
    }

    // Payment method selection (updated payloads)
    if (payload === 'PAYMENT_COD') {
      if (session.step === 'ask_payment') {
        await updateSession(psid, { tempData: { ...(session.tempData || {}), paymentMethod: 'cod' } });
        return confirmCOD(psid);
      }
    }

    if (payload === 'PAYMENT_TRANSFER') {
      if (session.step === 'ask_payment') {
        await updateSession(psid, { tempData: { ...(session.tempData || {}), paymentMethod: 'transfer' } });
        return sendBankInfo(psid);
      }
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
    
    // จัดการการเลือกที่อยู่ที่บันทึกไว้
    if (payload.startsWith('SELECT_ADDR_')) {
      const idx = parseInt(payload.replace('SELECT_ADDR_', ''), 10);
      if (!isNaN(idx)) {
        return handleSavedAddressSelection(psid, idx);
      }
    }
    
    // จัดการการเลือกกรอกที่อยู่ใหม่
    if (payload === 'NEW_ADDRESS') {
      return promptNewAddress(psid);
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
      console.log('[CLEAR_CART] Starting cart clear for psid:', psid);
      const sessionBefore = await getSession(psid);
      console.log('[CLEAR_CART] Cart before clearing:', sessionBefore.cart);
      
      await updateSession(psid, { cart: [] });
      
      const sessionAfter = await getSession(psid);
      console.log('[CLEAR_CART] Cart after clearing:', sessionAfter.cart);
      
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

    // เมนูเริ่มต้นจาก quick reply
    if (payload === 'Q_ORDER') {
      await disableAIForUser(psid);
      return showCategories(psid);
    }
    
    // เมนูสั่งซื้อผ่านเว็บไซต์
    if (payload === 'Q_ORDER_WEBSITE') {
      await disableAIForUser(psid);
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.winrichdynamic.com';
      const shopUrl = `${siteUrl.replace(/\/$/, '')}/shop`;
      return callSendAPI(psid, {
        attachment: {
          type: 'template',
          payload: {
            template_type: 'button',
            text: 'คลิกเพื่อเข้าสู่หน้าเว็บไซต์และสั่งซื้อสินค้าค่ะ',
            buttons: [
              {
                type: 'web_url',
                title: 'เข้าสู่หน้าสั่งซื้อ',
                url: shopUrl,
                webview_height_ratio: 'full',
              },
            ],
          },
        },
        quick_replies: [
          { content_type: 'text', title: 'เมนูหลัก', payload: 'SHOW_MENU' },
        ],
      });
    }
    
    // เมนูรับการแจ้งเตือน
    if (payload === 'Q_NOTIFICATION') {
      await disableAIForUser(psid);
      return callSendAPI(psid, {
        text: 'เพื่อรับการแจ้งเตือนการสั่งซื้อ กรุณายืนยันตัวตนเพื่อเชื่อมต่อระบบแจ้งเตือนค่ะ',
        quick_replies: [
          { content_type: 'text', title: 'ยืนยันตัวตน', payload: 'START_AUTH' },
          { content_type: 'text', title: 'เมนูหลัก', payload: 'SHOW_MENU' },
        ],
      });
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
      await callSendAPI(psid, { text: 'พิมพ์คำถามเกี่ยวกับสินค้าได้เลยนะคะ' });
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

    if (payload === 'MY_ORDERS') {
      return showMyOrders(psid);
    }

    if (payload === 'START_AUTH') {
      return startAuth(psid);
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

    // ตั้งค่าสีใหม่จาก quick reply
    if (payload.startsWith('SET_COL_')) {
      const [, idxStr, encoded] = payload.split('_');
      const idx = parseInt(idxStr, 10);
      const colorLabel = decodeURIComponent(encoded);
      if (!isNaN(idx) && session.cart[idx]) {
        session.cart[idx].selectedOptions = {
          ...(session.cart[idx].selectedOptions || {}),
          'สี': colorLabel,
        };
        await updateSession(psid, { cart: session.cart });
      }
      return showCart(psid);
    }
  }

  // รับ location สำหรับ Lalamove
  if (event.message && session.step === 'ask_lalamove_location' && event.message.attachments && event.message.attachments.length > 0) {
    const attachment = event.message.attachments[0];
    if (attachment.type === 'location' && attachment.payload) {
      const coordinates = attachment.payload.coordinates;
      if (coordinates && coordinates.lat && coordinates.long) {
        return handleLalamoveLocation(psid, coordinates.lat, coordinates.long);
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
    // เพิ่มจำนวนข้อความที่ไม่ใช่เมนู
    await incrementNonMenuMessageCount(psid);
    
    // ตรวจสอบโหมดอัตโนมัติ
    const autoModeEnabled = await isAutoModeEnabled(psid);
    
    // check AI mode first
    const aiEnabled = await isAIEnabled(psid);
    console.log(`[AI Debug] PSID: ${psid}, AI Enabled: ${aiEnabled}, NonMenuCount: ${session.nonMenuMessageCount}, AutoMode: ${autoModeEnabled}`);
    
    // เปิดโหมด AI ให้ผู้ใช้ใหม่โดยอัตโนมัติ
    if (!aiEnabled) {
      console.log(`[AI Debug] Enabling AI for new user: ${psid}`);
      await enableAIForUser(psid);
    }
    
    const question = event.message.text.trim();
    if (question.length > 0) {
      console.log(`[AI Debug] Processing question: "${question}"`);
      
      try {
        // เพิ่มข้อความผู้ใช้ลงในประวัติ
        await addToConversationHistory(psid, 'user', question);
        
        // ตรวจสอบว่าควรเปิดโหมดอัตโนมัติหรือไม่
        if (!autoModeEnabled && session.nonMenuMessageCount >= 2) {
          console.log(`[AutoMode] Enabling auto mode for ${psid} after ${session.nonMenuMessageCount} non-menu messages`);
          
          // เปิดโหมดอัตโนมัติและเรียก AI มาตอบทันที
          const answer = await enableAutoModeAndRespond(psid, question);
          
          // ใช้ระบบ [cut] และ [SEND_IMAGE:...] ถ้าจำเป็น
          if (hasCutOrImageCommands(answer)) {
            await sendSmartMessage(psid, answer, true); // ส่งพร้อมเมนู
          } else {
            await callSendAPI(psid, {
              text: answer,
              quick_replies: [
                { content_type: 'text', title: 'เมนูหลัก', payload: 'SHOW_MENU' },
                { content_type: 'text', title: 'ดูสินค้า', payload: 'SHOW_PRODUCTS' },
              ],
            });
          }
          return;
        }
        
        // ถ้าโหมดอัตโนมัติเปิดอยู่ ให้ส่งประวัติการสนทนาไปด้วย
        if (autoModeEnabled) {
          console.log(`[AI Debug] Using auto mode with conversation history`);
          const conversationHistory = await getConversationHistory(psid);
          const systemInstructions = await buildSystemInstructions('Basic');
          const answer = await getAssistantResponse(systemInstructions, conversationHistory, question);
          
          // เพิ่มข้อความ AI ลงในประวัติ
          await addToConversationHistory(psid, 'assistant', answer);
          
          // ใช้ระบบ [cut] และ [SEND_IMAGE:...] ถ้าจำเป็น
          if (hasCutOrImageCommands(answer)) {
            await sendSmartMessage(psid, answer, true); // ส่งพร้อมเมนู
          } else {
            await callSendAPI(psid, {
              text: answer,
              quick_replies: [
                { content_type: 'text', title: 'เมนูหลัก', payload: 'SHOW_MENU' },
                { content_type: 'text', title: 'ดูสินค้า', payload: 'SHOW_PRODUCTS' },
              ],
            });
          }
          return;
        } else {
          // โหมด AI ปกติ
          console.log(`[AI Debug] Using basic AI mode`);
          const systemInstructions = await buildSystemInstructions('Basic');
          const answer = await getAssistantResponse(systemInstructions, [], question);
          
          // ใช้ระบบ [cut] และ [SEND_IMAGE:...] ถ้าจำเป็น
          if (hasCutOrImageCommands(answer)) {
            await sendSmartMessage(psid, answer, true); // ส่งพร้อมเมนู
          } else {
            await callSendAPI(psid, {
              text: answer,
              quick_replies: [
                { content_type: 'text', title: 'เมนูหลัก', payload: 'SHOW_MENU' },
              ],
            });
          }
          return;
        }
      } catch (error) {
        console.error(`[AI Debug] Error processing AI response:`, error);
        // ถ้า AI มีปัญหา ให้ส่งข้อความข้อผิดพลาด
        await callSendAPI(psid, {
          text: 'ขออภัยค่ะ ระบบ AI ขัดข้องชั่วคราว กรุณาลองใหม่อีกครั้งค่ะ',
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
      // รีเซ็ตข้อมูลผู้ใช้ทุกอย่าง (สำหรับการทดสอบใหม่)
      await clearSession(psid); // ลบ session/cart/temp ทั้งหมด
      await disableAIForUser(psid); // ปิดโหมด AI หากเปิดอยู่

      // ลบเอกสาร MessengerUser ออกจาก DB เพื่อให้สภาพเหมือนใหม่
      try {
        await connectDB();
        await MessengerUser.deleteOne({ psid });
      } catch (err) {
        console.error('[#delete] remove MessengerUser error', err);
      }

      await sendTypingOn(psid);
      // ส่งเมนูเริ่มต้นอีกครั้ง
      return sendWelcome(psid);
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
    
    // ถ้าอยู่ในขั้นตอนรอที่อยู่ใหม่
    if (session.step === 'await_new_address') {
      return handleAddress(psid, event.message.text, (session.tempData as any)?.name);
    }

    // ถ้าอยู่ในขั้นตอนรอ coordinates สำหรับ Lalamove
    if (session.step === 'ask_lalamove_location') {
      return handleCoordinatesText(psid, event.message.text);
    }

    // จัดการข้อความทักทายเฉพาะเมื่อไม่ได้อยู่ในโหมด AI
    if (!aiEnabled && (txt.includes('สวัสดี') || txt.includes('สวัสดีค่ะ') || txt.includes('hello'))) {
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

  // แก้ไขจำนวนสินค้าในตะกร้า (await_new_qty)
  if (event.message && session.step === 'await_new_qty' && event.message.text) {
    const qtyNum = parseInt(event.message.text.replace(/[^0-9]/g, ''), 10);
    if (!isNaN(qtyNum) && qtyNum > 0 && qtyNum <= 1000) {
      const editIdx = (session.tempData as any)?.editIdx;
      if (typeof editIdx === 'number' && session.cart[editIdx]) {
        session.cart[editIdx].quantity = qtyNum;
        if (session.cart[editIdx].quantity <= 0) {
          session.cart.splice(editIdx, 1);
        }
        await updateSession(psid, { cart: session.cart, step: 'summary', tempData: {} });
      }
      return showCart(psid);
    }
    await callSendAPI(psid, { text: 'กรุณาพิมพ์ตัวเลขจำนวนเต็ม 1-1000 เท่านั้นค่ะ' });
    return;
  }

  // ถ้าไม่เข้าเงื่อนไขใด และไม่ได้อยู่ในโหมด AI ให้ส่งเมนูเริ่มต้น
  const currentAiEnabled = await isAIEnabled(psid);
  if (!currentAiEnabled) {
    if (session.step === 'browse') {
      return sendWelcome(psid);
    }
    return showCategories(psid);
  }
  
  // ถ้าอยู่ในโหมด AI แต่ไม่ได้ส่งข้อความใดๆ ให้ส่งข้อความแนะนำ
  if (currentAiEnabled && event.message && event.message.text) {
    await callSendAPI(psid, {
      text: 'กรุณาพิมพ์คำถามหรือความต้องการของคุณได้เลยค่ะ',
      quick_replies: [
        { content_type: 'text', title: 'เมนูหลัก', payload: 'SHOW_MENU' },
        { content_type: 'text', title: 'ดูสินค้า', payload: 'SHOW_PRODUCTS' },
      ],
    });
    return;
  }
}

// ฟังก์ชันแจ้งเตือนแอดมินผ่าน SMS และ LINE เมื่อผู้ใช้กด "ติดต่อแอดมิน"
async function notifyAdminsContact(userPsid: string) {
  try {
    await connectDB();
    
    // ส่ง SMS แจ้งเตือนแอดมิน
    const adminList = await AdminPhone.find({}, 'phoneNumber').lean();
    if (adminList && adminList.length > 0) {
      const smsMsg = `มีลูกค้ากด "ติดต่อแอดมิน" (PSID: ${userPsid}) ผ่านเพจ Facebook กรุณาตอบกลับค่ะ`;
      await Promise.allSettled(
        adminList.map((a: any) => sendSMS(a.phoneNumber, smsMsg))
      );
      console.log(`[notifyAdminsContact] ส่ง SMS แจ้งเตือนไปยังแอดมิน ${adminList.length} คน`);
    } else {
      console.warn('[notifyAdminsContact] ไม่พบเบอร์โทรแอดมินในระบบ');
    }
    
    // ส่งแจ้งเตือนไปยังกลุ่ม LINE
    try {
      const { notifyAllLineGroups } = await import('@/utils/line');
      const lineMsg = `🚨 แจ้งเตือน: มีลูกค้ากด "ติดต่อแอดมิน" ในแชทเฟซบุ๊ค\n\nPSID: ${userPsid}\nเวลา: ${new Date().toLocaleString('th-TH', { timeZone: 'Asia/Bangkok' })}\n\nกรุณาตอบกลับลูกค้าด้วยค่ะ`;
      
      const lineResult = await notifyAllLineGroups(lineMsg);
      if (lineResult) {
        console.log(`[notifyAdminsContact] ส่งแจ้งเตือน LINE สำเร็จ ${lineResult.successful} กลุ่ม, ล้มเหลว ${lineResult.failed} กลุ่ม`);
      }
    } catch (lineError) {
      console.error('[notifyAdminsContact] ส่งแจ้งเตือน LINE ไม่สำเร็จ:', lineError);
    }
    
  } catch (err) {
    console.error('[notifyAdminsContact] error', err);
  }
}