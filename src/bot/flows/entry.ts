import { callSendAPI } from '@/utils/messenger';
import { getSession, clearSession, updateSession } from '../state';
import { sendTypingOn } from '@/utils/messenger';
import connectDB from '@/lib/db';
import AdminPhone from '@/models/AdminPhone';
import { sendSMS } from '@/app/notification';
import { getAssistantResponse, buildSystemInstructions, enableAIForUser, disableAIForUser, isAIEnabled, addToConversationHistory, getConversationHistory, addToConversationHistoryWithContext } from '@/utils/openai-utils';
import MessengerUser from '@/models/MessengerUser';
import { sendTextMessage, hasCutOrImageCommands } from '@/utils/messenger-utils';

interface MessagingEvent {
  sender: { id: string };
  message?: {
    text?: string;
    quick_reply?: { payload: string };
    attachments?: { type: string; payload: any }[];
  };
  postback?: {
    title?: string;
    payload: string;
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
      return callSendAPI(psid, {
        text: 'สวัสดีค่ะ ยินดีให้บริการค่ะ กรุณาพิมพ์คำถามหรือความต้องการของคุณได้เลยค่ะ'
      });
    }
  }

  // จัดการ quick reply events
  if (event.message && event.message.quick_reply) {
    const payload = event.message.quick_reply.payload;
    
    if (payload === 'GET_STARTED') {
      // เปิดโหมด AI ให้ผู้ใช้ใหม่โดยอัตโนมัติ
      await enableAIForUser(psid);
      return callSendAPI(psid, {
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
        return callSendAPI(psid, { text: 'รีเซ็ตข้อมูลแล้วค่ะ ยินดีให้บริการค่ะ' });
      }

      if (question.includes('/ปิดเอไอ')) {
        // ตรวจสอบว่าเป็นแอดมินเพจหรือไม่
        if (psid === PAGE_ID) {
          // แอดมินเพจ - ปิด AI สำหรับผู้ใช้ทั้งหมด
          try {
            await connectDB();
            await MessengerUser.updateMany({}, { aiEnabled: false, updatedAt: new Date() });
            console.log('[Admin] ปิดโหมด AI สำหรับผู้ใช้ทั้งหมดแล้ว');
            await callSendAPI(psid, { text: 'ปิดโหมด AI สำหรับผู้ใช้ทั้งหมดแล้วค่ะ' });
          } catch (error) {
            console.error('[Admin] Error ปิดโหมด AI สำหรับผู้ใช้ทั้งหมด:', error);
            await callSendAPI(psid, { text: 'เกิดข้อผิดพลาดในการปิดโหมด AI สำหรับผู้ใช้ทั้งหมดค่ะ' });
          }
          return;
        } else {
          // ผู้ใช้ทั่วไป - ปิด AI สำหรับตัวเอง
          await disableAIForUser(psid);
          return callSendAPI(psid, { text: 'ปิดโหมด AI แล้วค่ะ' });
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
            await callSendAPI(psid, { text: 'เปิดโหมด AI สำหรับผู้ใช้ทั้งหมดแล้วค่ะ' });
          } catch (error) {
            console.error('[Admin] Error เปิดโหมด AI สำหรับผู้ใช้ทั้งหมด:', error);
            await callSendAPI(psid, { text: 'เกิดข้อผิดพลาดในการเปิดโหมด AI สำหรับผู้ใช้ทั้งหมดค่ะ' });
          }
          return;
        } else {
          // ผู้ใช้ทั่วไป - เปิด AI สำหรับตัวเอง
          await enableAIForUser(psid);
          return callSendAPI(psid, { text: 'เปิดโหมด AI แล้วค่ะ ยินดีให้บริการค่ะ' });
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
            
            await callSendAPI(psid, { text: statusMessage });
          } catch (error) {
            console.error('[Admin] Error ดูสถานะ AI:', error);
            await callSendAPI(psid, { text: 'เกิดข้อผิดพลาดในการดูสถานะ AI ค่ะ' });
          }
          return;
        } else {
          // ผู้ใช้ทั่วไป - ดูสถานะ AI ของตัวเอง
          const aiEnabled = await isAIEnabled(psid);
          const statusText = aiEnabled ? '✅ AI เปิดอยู่ค่ะ' : '❌ AI ปิดอยู่ค่ะ';
          return callSendAPI(psid, { text: statusText });
        }
      }

      // ตรวจสอบโหมด AI
    const aiEnabled = await isAIEnabled(psid);
    
    // เปิดโหมด AI ให้ผู้ใช้ใหม่โดยอัตโนมัติ
    if (!aiEnabled) {
      console.log(`[AI Debug] Enabling AI for new user: ${psid}`);
      await enableAIForUser(psid);
    }
      
      try {
        // เพิ่มข้อความผู้ใช้ลงในประวัติ
        await addToConversationHistory(psid, 'user', question);
        
        // เรียก AI ตอบคำถาม
          const conversationHistory = await getConversationHistory(psid);
          const systemInstructions = await buildSystemInstructions('Basic');
          const answer = await getAssistantResponse(systemInstructions, conversationHistory, question);
          
          // เพิ่มข้อความ AI ลงในประวัติ
          await addToConversationHistory(psid, 'assistant', answer);
          
          // ใช้ระบบ [cut] และ [SEND_IMAGE:...] ถ้าจำเป็น
          if (hasCutOrImageCommands(answer)) {
          await sendTextMessage(psid, answer);
        } else {
          await callSendAPI(psid, { text: answer });
        }
        
        return;
      } catch (error) {
        console.error(`[AI Debug] Error processing AI response:`, error);
        // ถ้า AI มีปัญหา ให้ส่งข้อความข้อผิดพลาด
        await callSendAPI(psid, {
          text: 'ขออภัยค่ะ ระบบมีปัญหาเล็กน้อย กรุณาลองใหม่อีกครั้งค่ะ'
        });
        return;
      }
    }
  }

  // จัดการไฟล์แนบ (รูปภาพ, ไฟล์)
  if (event.message && event.message.attachments && event.message.attachments.length > 0) {
    const attachment = event.message.attachments[0];
    
    if (attachment.type === 'image') {
      // ส่งรูปภาพไปให้ AI ประมวลผล
      const aiEnabled = await isAIEnabled(psid);
      
      if (!aiEnabled) {
        await enableAIForUser(psid);
      }
      
      try {
        await addToConversationHistoryWithContext(psid, 'user', 'กรุณาวิเคราะห์รูปภาพนี้', JSON.stringify([
          { type: 'image_url', image_url: { url: (attachment.payload as any).url } }
        ]));
        
        const conversationHistory = await getConversationHistory(psid);
        const systemInstructions = await buildSystemInstructions('Basic');
        const answer = await getAssistantResponse(systemInstructions, conversationHistory, [
          { type: 'text', text: 'กรุณาวิเคราะห์รูปภาพนี้' },
          { type: 'image_url', image_url: { url: (attachment.payload as any).url } }
        ]);
        
        await addToConversationHistory(psid, 'assistant', answer);
        
        if (hasCutOrImageCommands(answer)) {
          await sendTextMessage(psid, answer);
        } else {
          await callSendAPI(psid, { text: answer });
        }
        
      return;
      } catch (error) {
        console.error(`[AI Debug] Error processing image:`, error);
        await callSendAPI(psid, {
          text: 'ขออภัยค่ะ ไม่สามารถประมวลผลรูปภาพได้ในขณะนี้ กรุณาลองใหม่อีกครั้งค่ะ'
        });
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