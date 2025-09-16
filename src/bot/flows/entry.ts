import { callSendAPI } from '@/utils/messenger';
import { getSession, clearSession, updateSession } from '../state';
import { sendTypingOn } from '@/utils/messenger';
import connectDB from '@/lib/db';
import AdminPhone from '@/models/AdminPhone';
import { sendSMS } from '@/app/notification';
import { getAssistantResponse, buildSystemInstructions, enableAIForUser, disableAIForUser, isAIEnabled, addToConversationHistory, getConversationHistory, addToConversationHistoryWithContext, enableFilterForUser, disableFilterForUser, isFilterDisabled, imageUrlToDataUrl, isUrlAccessible } from '@/utils/openai-utils';
import MessengerUser from '@/models/MessengerUser';
import { sendTextMessage, hasCutOrImageCommands, sendFilteredMessage } from '@/utils/messenger-utils';
import { enqueueAIMessage, enqueueAIContent } from '@/utils/ai-batcher';

interface MessagingEvent {
  sender: { id: string };
  message?: {
    text?: string;
    mid?: string;
    quick_reply?: { payload: string };
    attachments?: { type: string; payload: any }[];
  };
  postback?: {
    title?: string;
    payload: string;
    mid?: string;
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
  if (event.message && (
    (event as any).message.is_echo || 
    (event as any).message.app_id ||
    (event as any).message.metadata?.is_echo ||
    (event as any).message.metadata?.app_id
  )) {
    console.log('[Flow] skip echo event');
    return;
  }
  if ((event as any).delivery || (event as any).read) {
    console.log('[Flow] skip delivery/read event');
    return;
  }

  console.log('[Flow] handleEvent for', psid, JSON.stringify(event));

  const session = await getSession(psid);

  // จัดการ postback events
  if (event.postback) {
    const payload = event.postback.payload || '';
    
    if (payload === 'GET_STARTED') {
      // เปิดโหมด AI ให้ผู้ใช้ใหม่โดยอัตโนมัติ
      await enableAIForUser(psid);
      return sendFilteredMessage(psid, {
        text: 'สวัสดีค่ะ ยินดีให้บริการค่ะ กรุณาพิมพ์คำถามหรือความต้องการของคุณได้เลยค่ะ'
      });
    }

    // Treat all other postbacks as if user typed the button title
    const questionFromPostback = (event.postback.title || payload || '').trim();
    if (questionFromPostback.length > 0) {
      // ตรวจสอบ/เปิดโหมด AI อัตโนมัติให้ผู้ใช้ใหม่
      const aiEnabled = await isAIEnabled(psid);
      if (!aiEnabled) {
        console.log(`[AI Debug] Enabling AI for new user (postback): ${psid}`);
        await enableAIForUser(psid);
      }
      const mid = event.postback.mid as string | undefined;
      enqueueAIMessage(psid, mid, questionFromPostback);
      return;
    }
  }

  // จัดการ quick reply events
  if (event.message && event.message.quick_reply) {
    const payload = event.message.quick_reply.payload;
    
    if (payload === 'GET_STARTED') {
      // เปิดโหมด AI ให้ผู้ใช้ใหม่โดยอัตโนมัติ
      await enableAIForUser(psid);
      return sendFilteredMessage(psid, {
        text: 'สวัสดีค่ะ ยินดีให้บริการค่ะ กรุณาพิมพ์คำถามหรือความต้องการของคุณได้เลยค่ะ'
      });
    }
  }

  // จัดการข้อความข้อความ
  if (event.message && event.message.text) {
    const question = event.message.text.trim();
    
    if (question.length > 0) {
      console.log(`[AI Debug] Processing question: "${question}"`);
      
      // ตรวจสอบคำสั่งพิเศษ
      if (question.includes('/delete')) {
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
        // เปิดโหมด AI ใหม่
        await enableAIForUser(psid);
        return sendFilteredMessage(psid, { text: 'รีเซ็ตข้อมูลแล้วค่ะ ยินดีให้บริการค่ะ' });
      }

      if (question.includes('/ปิดเอไอ')) {
        // ตรวจสอบว่าเป็นแอดมินเพจหรือไม่
        if (psid === PAGE_ID) {
          // แอดมินเพจ - ปิด AI สำหรับผู้ใช้ทั้งหมด
          try {
            await connectDB();
            await MessengerUser.updateMany({}, { aiEnabled: false, updatedAt: new Date() });
            console.log('[Admin] ปิดโหมด AI สำหรับผู้ใช้ทั้งหมดแล้ว');
            await sendFilteredMessage(psid, { text: 'ปิดโหมด AI สำหรับผู้ใช้ทั้งหมดแล้วค่ะ' });
          } catch (error) {
            console.error('[Admin] Error ปิดโหมด AI สำหรับผู้ใช้ทั้งหมด:', error);
            await sendFilteredMessage(psid, { text: 'เกิดข้อผิดพลาดในการปิดโหมด AI สำหรับผู้ใช้ทั้งหมดค่ะ' });
          }
          return;
        } else {
          // ผู้ใช้ทั่วไป - ปิด AI สำหรับตัวเอง
          await disableAIForUser(psid);
          return sendFilteredMessage(psid, { text: 'ปิดโหมด AI แล้วค่ะ' });
        }
      }

      if (question.includes('/เปิดเอไอ')) {
        // ตรวจสอบว่าเป็นแอดมินเพจหรือไม่
        if (psid === PAGE_ID) {
          // แอดมินเพจ - เปิด AI สำหรับผู้ใช้ทั้งหมด
          try {
            await connectDB();
            await MessengerUser.updateMany({}, { aiEnabled: true, updatedAt: new Date() });
            console.log('[Admin] เปิดโหมด AI สำหรับผู้ใช้ทั้งหมดแล้ว');
            await sendFilteredMessage(psid, { text: 'เปิดโหมด AI สำหรับผู้ใช้ทั้งหมดแล้วค่ะ' });
          } catch (error) {
            console.error('[Admin] Error เปิดโหมด AI สำหรับผู้ใช้ทั้งหมด:', error);
            await sendFilteredMessage(psid, { text: 'เกิดข้อผิดพลาดในการเปิดโหมด AI สำหรับผู้ใช้ทั้งหมดค่ะ' });
          }
          return;
        } else {
          // ผู้ใช้ทั่วไป - เปิด AI สำหรับตัวเอง
          await enableAIForUser(psid);
          return sendFilteredMessage(psid, { text: 'เปิดโหมด AI แล้วค่ะ ยินดีให้บริการค่ะ' });
        }
      }

      if (question.includes('/สถานะเอไอ')) {
        // ตรวจสอบว่าเป็นแอดมินเพจหรือไม่
        if (psid === PAGE_ID) {
          // แอดมินเพจ - ดูสถานะ AI ของผู้ใช้ทั้งหมด
          try {
            await connectDB();
            const totalUsers = await MessengerUser.countDocuments({});
            const aiEnabledUsers = await MessengerUser.countDocuments({ aiEnabled: true });
            const aiDisabledUsers = totalUsers - aiEnabledUsers;
            
            const statusMessage = `📊 สถานะ AI ของผู้ใช้ทั้งหมด:\n\n` +
              `👥 ผู้ใช้ทั้งหมด: ${totalUsers} คน\n` +
              `✅ AI เปิด: ${aiEnabledUsers} คน\n` +
              `❌ AI ปิด: ${aiDisabledUsers} คน\n\n` +
              `คำสั่งที่ใช้ได้:\n` +
              `/เปิดเอไอ - เปิด AI สำหรับผู้ใช้ทั้งหมด\n` +
              `/ปิดเอไอ - ปิด AI สำหรับผู้ใช้ทั้งหมด\n` +
              `/สถานะเอไอ - ดูสถานะปัจจุบัน`;
            
            await sendFilteredMessage(psid, { text: statusMessage });
          } catch (error) {
            console.error('[Admin] Error ดูสถานะ AI:', error);
            await sendFilteredMessage(psid, { text: 'เกิดข้อผิดพลาดในการดูสถานะ AI ค่ะ' });
          }
          return;
        } else {
          // ผู้ใช้ทั่วไป - ดูสถานะ AI ของตัวเอง
          const aiEnabled = await isAIEnabled(psid);
          const filterDisabled = await isFilterDisabled(psid);
          const statusText = `📊 สถานะของคุณ:\n\n` +
            `🤖 AI: ${aiEnabled ? '✅ เปิดอยู่' : '❌ ปิดอยู่'}\n` +
            `🔍 การกรองข้อความ: ${filterDisabled ? '❌ ปิดอยู่ (แสดงข้อความทั้งหมด)' : '✅ เปิดอยู่ (กรองข้อความ)'}\n\n` +
            `คำสั่งที่ใช้ได้:\n` +
            `/tag - ปิดการกรองข้อความ (แสดงข้อความทั้งหมด)\n` +
            `/tag/ - เปิดการกรองข้อความ (กรองข้อความ)\n` +
            `/สถานะเอไอ - ดูสถานะปัจจุบัน`;
          return sendFilteredMessage(psid, { text: statusText });
        }
      }

      // จัดการคำสั่ง /tag (ปิดการกรองข้อความ)
      if (question.trim() === '/tag') {
        await disableFilterForUser(psid);
        return sendFilteredMessage(psid, { 
          text: '🔍 ปิดการกรองข้อความแล้วค่ะ ตอนนี้จะแสดงข้อความทั้งหมดที่ AI สร้างขึ้น\n\nพิมพ์ /tag/ เพื่อเปิดการกรองข้อความกลับคืน' 
        });
      }

      // จัดการคำสั่ง /tag/ (เปิดการกรองข้อความ)
      if (question.trim() === '/tag/') {
        await enableFilterForUser(psid);
        return sendFilteredMessage(psid, { 
          text: '🔍 เปิดการกรองข้อความแล้วค่ะ ตอนนี้จะแสดงเฉพาะข้อความที่อยู่ในแท็ก THAI_REPLY\n\nพิมพ์ /tag เพื่อปิดการกรองข้อความ' 
        });
      }

      // ตรวจสอบโหมด AI
    const aiEnabled = await isAIEnabled(psid);
    
    // เปิดโหมด AI ให้ผู้ใช้ใหม่โดยอัตโนมัติ
    if (!aiEnabled) {
      console.log(`[AI Debug] Enabling AI for new user: ${psid}`);
      await enableAIForUser(psid);
    }
      
      // ส่งเข้าตัวรวมข้อความเพื่อรอ 15 วินาที แล้วตอบครั้งเดียว
      const mid = (event as any)?.message?.mid as string | undefined;
      enqueueAIMessage(psid, mid, question);
      return;
    }
  }

  // จัดการไฟล์แนบ (รูปภาพ, ไฟล์)
  if (event.message && event.message.attachments && event.message.attachments.length > 0) {
    const imageAttachments = event.message.attachments.filter((a: any) => a?.type === 'image');
    if (imageAttachments.length > 0) {
      // ส่งรูปภาพหลายไฟล์ไปให้ AI ประมวลผล (เก็บรูปเป็น base64 ในประวัติเมื่อทำได้)
      const aiEnabled = await isAIEnabled(psid);
      if (!aiEnabled) {
        await enableAIForUser(psid);
      }

      try {
        const imageParts: any[] = [];
        for (const att of imageAttachments) {
          const rawUrl = (att.payload as any)?.url;
          if (!rawUrl) continue;
          const dataUrl = await imageUrlToDataUrl(rawUrl).catch(() => null);
          if (dataUrl) {
            imageParts.push({ type: 'image_url', image_url: { url: dataUrl } });
            continue;
          }
          const ok = await isUrlAccessible(rawUrl).catch(() => false);
          if (ok) {
            imageParts.push({ type: 'image_url', image_url: { url: rawUrl } });
          }
        }

        let visionContent: any[];
        if (imageParts.length > 0) {
          visionContent = [
            { type: 'text', text: imageParts.length > 1 ? 'กรุณาวิเคราะห์รูปภาพเหล่านี้' : 'กรุณาวิเคราะห์รูปภาพนี้' },
            ...imageParts
          ];
        } else {
          visionContent = [
            { type: 'text', text: 'ผู้ใช้ส่งรูปภาพมา แต่ลิงก์ภาพหมดอายุ/ไม่สามารถเข้าถึงได้ทุกไฟล์ กรุณาให้ผู้ใช้ส่งรูปใหม่' }
          ];
        }

        // ส่งเข้า batch เหมือนข้อความ รอ 15 วิ แล้วตอบครั้งเดียวรวมกับข้อความอื่นๆ หากมี
        const mid = (event as any)?.message?.mid as string | undefined;
        enqueueAIContent(psid, mid, visionContent);
        return;
      } catch (error) {
        console.error(`[AI Debug] Error processing images:`, error);
        await sendFilteredMessage(psid, { text: 'ขออภัยค่ะ ไม่สามารถประมวลผลรูปภาพได้ในขณะนี้ กรุณาลองใหม่อีกครั้งค่ะ' });
        return;
      }
    }
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
