import crypto from 'crypto';
import https from 'https';

/**
 * Utility สำหรับเรียก Facebook Send API และตรวจสอบลายเซ็นของ Webhook
 */

const PAGE_ACCESS_TOKEN = process.env.FB_PAGE_ACCESS_TOKEN || '';
const APP_SECRET = process.env.FB_APP_SECRET || '';

const httpsAgent = new https.Agent({ keepAlive: true });
const INITIAL_TIMEOUT_MS = 10_000; // 10 วินาที รอบแรก ลดเวลา timeout

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

/**
 * ส่งข้อความ/เทมเพลตไปยัง PSID ผ่าน Facebook Send API
 */
export async function callSendAPI(recipientId: string, message: FBMessagePayload, retries = 2) {
  if (!PAGE_ACCESS_TOKEN) {
    console.error('[Messenger] PAGE_ACCESS_TOKEN ไม่ถูกตั้งค่า');
    return;
  }

  const url = `https://graph.facebook.com/v19.0/me/messages?access_token=${PAGE_ACCESS_TOKEN}`;

  const body = 'sender_action' in message && Object.keys(message).length === 1
    ? {
        recipient: { id: recipientId },
        sender_action: (message as any).sender_action,
      }
    : {
        recipient: { id: recipientId },
        message,
      };

  // Log request ที่จะส่งไปยัง Facebook
  console.log('[SendAPI] ->', JSON.stringify(body));

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), attempt === 0 ? INITIAL_TIMEOUT_MS : 8000);

      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        // @ts-ignore Node fetch accepts agent in runtime
        agent: httpsAgent as any,
        signal: controller.signal,
      });
      clearTimeout(timeout);

      const text = await res.text();
      console.log('[SendAPI] <-', res.status, text);

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
  if (!APP_SECRET) return false; // ถ้าไม่มี secret ก็ข้าม (ไม่แนะนำใน production)

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
  callSendAPIAsync(recipientId, { sender_action: 'typing_on' });
}

// Helper ยิงข้อความโดยไม่รอผล ป้องกันการบล็อก event loop
export function callSendAPIAsync(recipientId: string, message: FBMessagePayload) {
  // fire-and-forget
  callSendAPI(recipientId, message).catch((err) => console.error('[Messenger] async error', err));
} 