import crypto from 'crypto';

const LINE_API_BASE = 'https://api.line.me/v2/bot';
const ACCESS_TOKEN = process.env.LINE_CHANNEL_ACCESS_TOKEN || '';
const CHANNEL_SECRET = process.env.LINE_CHANNEL_SECRET || '';

export function verifyLineSignature(rawBody: string, signature?: string | null) {
  if (!CHANNEL_SECRET || !signature) return false;
  const hmac = crypto.createHmac('sha256', CHANNEL_SECRET).update(rawBody).digest('base64');
  try {
    return crypto.timingSafeEqual(Buffer.from(hmac), Buffer.from(signature));
  } catch {
    return false;
  }
}

export async function linePush(
  to: string,
  message:
    | string
    | { type: string; [k: string]: any }
    | Array<{ type: string; [k: string]: any }>
) {
  console.log('[LINE Push] เริ่มส่งข้อความไปยัง:', to);
  console.log('[LINE Push] ข้อความ:', message);
  
  if (!ACCESS_TOKEN) {
    console.error('[LINE Push] LINE_CHANNEL_ACCESS_TOKEN ไม่ถูกตั้งค่า');
    throw new Error('LINE_CHANNEL_ACCESS_TOKEN is missing');
  }
  
  const messages = Array.isArray(message)
    ? message
    : [{ type: 'text', text: typeof message === 'string' ? message : '' }];
  
  console.log('[LINE Push] แปลงข้อความเป็น:', messages);
  
  const payload = { to, messages };
  console.log('[LINE Push] ส่ง payload:', JSON.stringify(payload, null, 2));
  
  try {
    const res = await fetch(`${LINE_API_BASE}/message/push`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${ACCESS_TOKEN}`,
      },
      body: JSON.stringify(payload),
    });
    
    console.log('[LINE Push] HTTP status:', res.status);
    
    const bodyText = await res.text();
    if (!res.ok) {
      console.error('[LINE Push] HTTP error body:', bodyText);
      throw new Error(`LINE push error ${res.status}: ${bodyText}`);
    }
    
    let parsed: any = null;
    try {
      parsed = bodyText ? JSON.parse(bodyText) : { ok: true };
    } catch {
      parsed = { ok: true };
    }
    console.log('[LINE Push] ส่งสำเร็จ:', parsed);
    return parsed;
  } catch (error) {
    console.error('[LINE Push] เกิดข้อผิดพลาด:', error);
    throw error;
  }
}

export async function lineReply(replyToken: string, message: string | Array<{ type: string; [k: string]: any }>) {
  if (!ACCESS_TOKEN) throw new Error('LINE_CHANNEL_ACCESS_TOKEN is missing');
  const messages = Array.isArray(message) ? message : [{ type: 'text', text: message }];
  const res = await fetch(`${LINE_API_BASE}/message/reply`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${ACCESS_TOKEN}`,
    },
    body: JSON.stringify({ replyToken, messages }),
  });
  if (!res.ok) throw new Error(`LINE reply error ${res.status}: ${await res.text()}`);
}

// ฟังก์ชันส่งแจ้งเตือนไปยังกลุ่มไลน์ทั้งหมดที่เปิดใช้งานอยู่
export async function notifyAllLineGroups(message: string) {
  try {
    // Import แบบ dynamic เพื่อหลีกเลี่ยง circular dependency
    const { default: connectDB } = await import('@/lib/mongodb');
    const { default: LineNotificationGroup } = await import('@/models/LineNotificationGroup');
    
    await connectDB();
    
    // หากลุ่มไลน์ทั้งหมดที่เปิดใช้งานอยู่
    const activeGroups = await LineNotificationGroup.find({ enabled: true }).lean();
    
    if (activeGroups.length === 0) {
      console.log('[LINE Notify] ไม่พบกลุ่มไลน์ที่เปิดใช้งานอยู่');
      return;
    }
    
    console.log(`[LINE Notify] พบกลุ่มไลน์ที่เปิดใช้งาน ${activeGroups.length} กลุ่ม`);
    
    // ส่งข้อความไปยังทุกกลุ่ม
    const results = await Promise.allSettled(
      activeGroups.map(async (group) => {
        try {
          await linePush(group.groupId, message);
          console.log(`[LINE Notify] ส่งสำเร็จไปยังกลุ่ม ${group.groupId} (${group.sourceType})`);
          return { success: true, groupId: group.groupId, sourceType: group.sourceType };
        } catch (error) {
          console.error(`[LINE Notify] ส่งไม่สำเร็จไปยังกลุ่ม ${group.groupId}:`, error);
          return { success: false, groupId: group.groupId, sourceType: group.sourceType, error };
        }
      })
    );
    
    // สรุปผลการส่ง
    const successful = results.filter(r => r.status === 'fulfilled' && r.value.success).length;
    const failed = results.length - successful;
    
    console.log(`[LINE Notify] สรุปผลการส่ง: สำเร็จ ${successful} กลุ่ม, ล้มเหลว ${failed} กลุ่ม`);
    
    return { successful, failed, total: results.length };
    
  } catch (error) {
    console.error('[LINE Notify] เกิดข้อผิดพลาดในการส่งแจ้งเตือน:', error);
    throw error;
  }
}


