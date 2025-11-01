import crypto from 'crypto';


/**
 * Utility สำหรับเรียก Facebook Send API และตรวจสอบลายเซ็นของ Webhook
 */

const PAGE_ACCESS_TOKEN = process.env.FB_PAGE_ACCESS_TOKEN || '';
const APP_SECRET = process.env.FB_APP_SECRET || '';

// เวอร์ชันของ Graph API ปัจจุบัน (อัปเดตตามเอกสารล่าสุด)
const GRAPH_API_VERSION = 'v23.0';

// ตัวเลือก keep-alive ทำให้บางครั้ง fetch เกิด ETIMEDOUT (โดยเฉพาะบน Railway / Windows)
// จึงตัดออกแล้วใช้ตัวจัดการ connection ปกติของ Node แทน
const INITIAL_TIMEOUT_MS = 45_000; // รอได้สูงสุด 45 วินาทีรอบแรก

interface Recipient {
  id: string;
}

export interface FBMessagePayload {
  text?: string;
  attachment?: {
    type: string;
    payload: Record<string, unknown>;
  };
  quick_replies?: Array<Record<string, unknown>>;
  [key: string]: unknown;
}

// Helper log สำหรับ production/off
function devLog(...args: any[]) {
  if (process.env.NODE_ENV !== 'production') {
    console.log(...args);
  }
}

/**
 * ส่งข้อความ/เทมเพลตไปยัง PSID ผ่าน Facebook Send API
 */
export async function callSendAPI(recipientId: string, message: FBMessagePayload, retries = 2) {
  if (!PAGE_ACCESS_TOKEN) {
    console.error('[Messenger] PAGE_ACCESS_TOKEN ไม่ถูกตั้งค่า');
    return;
  }

  const url = `https://graph.facebook.com/${GRAPH_API_VERSION}/me/messages?access_token=${PAGE_ACCESS_TOKEN}`;

  const body = 'sender_action' in message && Object.keys(message).length === 1
    ? {
        recipient: { id: recipientId },
        sender_action: (message as any).sender_action,
      }
    : {
        recipient: { id: recipientId },
        messaging_type: 'RESPONSE',
        message,
      };

  // Log request
  console.log('[SendAPI] request', JSON.stringify(body));

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), attempt === 0 ? INITIAL_TIMEOUT_MS : 8000);

      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        // ไม่ส่ง custom agent เพื่อหลีกเลี่ยงบั๊ก keep-alive
        signal: controller.signal,
      });
      clearTimeout(timeout);

      const text = await res.text();
      console.log('[SendAPI] status', res.status, text);

      if (!res.ok && attempt < retries) {
        console.warn('[Messenger] ส่งข้อความล้มเหลว retry', attempt + 1);
        continue;
      }
      if (!res.ok) {
        console.error('[Messenger] ส่งข้อความล้มเหลว', text);
      }
      break; // success or last attempt
    } catch (err: any) {
      // รอบแรกเวลาเกิน timeout → AbortError ถือว่าปกติเมื่อ cold-start
      if (err?.name === 'AbortError' && attempt === 0) {
        console.warn('[Messenger] first attempt timeout, retrying');
        continue;
      }
      if (attempt < retries) {
        console.warn('[Messenger] fetch error retry', attempt + 1, err);
        continue;
      }
      console.error('[Messenger] เกิดข้อผิดพลาดในการเรียก Send API', err);
    }
  }
}

/**
 * ตรวจสอบ X-Hub-Signature-256 จาก Facebook
 */
export function verifyRequestSignature(rawBody: string, signatureHeader?: string) {
  if (!APP_SECRET) {
    console.warn('[Messenger] APP_SECRET not set, skipping signature verify');
    return true;
  }

  if (!signatureHeader) return false;

  const [method, signatureHash] = signatureHeader.split('=');
  if (method !== 'sha256') return false;

  const expectedHash = crypto
    .createHmac('sha256', APP_SECRET)
    .update(rawBody, 'utf-8')
    .digest('hex');

  return signatureHash === expectedHash;
}

// ส่ง typing indicator ให้ผู้ใช้รับรู้การประมวลผล
export function sendTypingOn(recipientId: string) {
  console.log('[Messenger] sendTypingOn ->', recipientId);
  callSendAPIAsync(recipientId, { sender_action: 'typing_on' });
}

// Helper ยิงข้อความโดยไม่รอผล ป้องกันการบล็อก event loop
export function callSendAPIAsync(recipientId: string, message: FBMessagePayload) {
  console.log('[Messenger] callSendAPIAsync ->', recipientId, JSON.stringify(message));
  // fire-and-forget
  callSendAPI(recipientId, message).catch((err) => console.error('[Messenger] async error', err));
}

// ยิง batch หลาย action ใน HTTP เดียว (typing_on + ข้อความหลัก ฯลฯ)
export async function callSendAPIBatch(recipientId: string, messages: FBMessagePayload[]) {
  if (!PAGE_ACCESS_TOKEN) {
    console.error('[Messenger] PAGE_ACCESS_TOKEN ไม่ถูกตั้งค่า');
    return;
  }
  // ตามสเปก Batch API ให้ส่ง access_token ที่ระดับ request หลัก
  const url = `https://graph.facebook.com/${GRAPH_API_VERSION}?access_token=${PAGE_ACCESS_TOKEN}`;

  const batch = messages.map((msg) => {
    const isSenderAction = 'sender_action' in msg && Object.keys(msg).length === 1;

    // body ของแต่ละรายการต้องเป็น URL-Encoded string (querystring)
    const params = new URLSearchParams();
    params.append('recipient', JSON.stringify({ id: recipientId }));

    if (isSenderAction) {
      params.append('sender_action', (msg as any).sender_action);
    } else {
      params.append('messaging_type', 'RESPONSE');
      params.append('message', JSON.stringify(msg));
    }

    return {
      method: 'POST',
      relative_url: 'me/messages',
      body: params.toString(),
    };
  });

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ batch }),
      // ไม่ส่ง custom agent เพื่อหลีกเลี่ยงบั๊ก keep-alive
    });

    const text = await res.text();
    devLog('[BatchAPI] status', res.status, text);

    if (!res.ok) {
      console.error('[Messenger] Batch API HTTP error', text);
      return;
    }

    // แม้ HTTP 200 แต่แต่ละ sub-request อาจ error ให้ตรวจ code ภายใน
    try {
      const results = JSON.parse(text);
      results.forEach((r: any, idx: number) => {
        if (!r || r.code !== 200) {
          console.error('[Messenger] Batch sub-error', idx, r);
        }
      });
    } catch {
      // ignore parse error
    }
  } catch (err) {
    console.error('[Messenger] Batch API fetch error', err);
  }
}

// ส่ง typing indicator แล้วตามด้วยข้อความต่าง ๆ แบบแยก API (ลดความซับซ้อนจาก Batch เพื่อ debug)
export function sendTypingAndMessages(recipientId: string, ...messages: FBMessagePayload[]) {
  // แสดง typing ทันที
  callSendAPIAsync(recipientId, { sender_action: 'typing_on' });

  // ส่งข้อความแต่ละรายการแบบ async fire-and-forget
  messages.forEach((msg) => callSendAPIAsync(recipientId, msg));
}

// ปิด pre-warm แบบ keep-alive ชั่วคราว เพื่อลดปัญหา timeout

// ยิง HEAD request ทุก 5 นาทีเพื่อให้ TLS connection ไม่ถูกปิดจากฝั่ง Facebook (ลด latency รอบแรก)
// setInterval(() => {
//   fetch('https://graph.facebook.com', {
//     method: 'HEAD',
//     // @ts-ignore Node fetch accepts agent
//     agent: httpsAgent as any,
//   }).catch(() => {});
// }, 300_000);

// ยิงหนึ่งครั้งทันทีตอนเริ่มเพื่อ pre-warm (cold-start)
// fetch('https://graph.facebook.com', { method: 'HEAD' }).catch(() => {}); 

/**
 * ส่งข้อความธรรมดาไปยัง PSID
 */
export async function sendMessage(psid: string, text: string): Promise<void> {
  await callSendAPI(psid, { text });
}

/**
 * ตอบกลับคอมเมนต์บน Facebook
 */
export async function replyToComment(
  commentId: string,
  message: string
): Promise<void> {
  if (!PAGE_ACCESS_TOKEN) {
    console.error('[Messenger] PAGE_ACCESS_TOKEN ไม่ถูกตั้งค่า');
    return;
  }

  const url = `https://graph.facebook.com/${GRAPH_API_VERSION}/${commentId}/comments?access_token=${PAGE_ACCESS_TOKEN}`;

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message }),
    });

    const text = await res.text();
    console.log('[ReplyComment] status', res.status, text);

    if (!res.ok) {
      console.error('[Messenger] ตอบกลับคอมเมนต์ล้มเหลว', text);
    }
  } catch (err) {
    console.error('[Messenger] เกิดข้อผิดพลาดในการตอบกลับคอมเมนต์', err);
  }
}

/**
 * ดึง PSID จาก Facebook User ID
 */
export async function getPSIDFromUserId(userId: string): Promise<string | null> {
  if (!PAGE_ACCESS_TOKEN) {
    console.error('[Messenger] PAGE_ACCESS_TOKEN ไม่ถูกตั้งค่า');
    return null;
  }

  const url = `https://graph.facebook.com/${GRAPH_API_VERSION}/${userId}?fields=id&access_token=${PAGE_ACCESS_TOKEN}`;

  try {
    const res = await fetch(url);
    const data = await res.json();

    if (data.id) {
      return data.id;
    }

    console.error('[Messenger] ไม่สามารถดึง PSID ได้', data);
    return null;
  } catch (err) {
    console.error('[Messenger] เกิดข้อผิดพลาดในการดึง PSID', err);
    return null;
  }
}

