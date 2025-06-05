import crypto from 'crypto';
import https from 'https';


/**
 * Utility สำหรับเรียก Facebook Send API และตรวจสอบลายเซ็นของ Webhook
 */

const PAGE_ACCESS_TOKEN = process.env.FB_PAGE_ACCESS_TOKEN || '';
const APP_SECRET = process.env.FB_APP_SECRET || '';

// เวอร์ชันของ Graph API ปัจจุบัน (อัปเดตตามเอกสารล่าสุด)
const GRAPH_API_VERSION = 'v23.0';

const httpsAgent = new https.Agent({ keepAlive: true });
// ลด timeout รอบแรกเหลือ 10 วินาที (handshake ปกติใช้ไม่เกิน 1 วิ)
const INITIAL_TIMEOUT_MS = 5_000;

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

  // Log request เฉพาะ dev เพื่อลด I/O ใน production
  devLog('[SendAPI] ->', JSON.stringify(body));

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
      devLog('[SendAPI] <-', res.status, text);

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
      // @ts-ignore
      agent: httpsAgent as any,
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

// Helper รวม typing indicator + ข้อความ (ใช้งานง่ายใน flows)
export function sendTypingAndMessages(recipientId: string, ...messages: FBMessagePayload[]) {
  const list: FBMessagePayload[] = [{ sender_action: 'typing_on' }, ...messages];
  callSendAPIBatch(recipientId, list).catch((err) => console.error('Batch error', err));
}

// ยิง HEAD request ทุก 5 นาทีเพื่อให้ TLS connection ไม่ถูกปิดจากฝั่ง Facebook (ลด latency รอบแรก)
setInterval(() => {
  fetch('https://graph.facebook.com', {
    method: 'HEAD',
    // @ts-ignore Node fetch accepts agent
    agent: httpsAgent as any,
  }).catch(() => {});
}, 300_000);

// ยิงหนึ่งครั้งทันทีตอนเริ่มเพื่อ pre-warm (cold-start)
fetch('https://graph.facebook.com', { method: 'HEAD' }).catch(() => {}); 