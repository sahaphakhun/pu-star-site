import crypto from 'crypto';

/**
 * Utility สำหรับเรียก Facebook Send API และตรวจสอบลายเซ็นของ Webhook
 */

const PAGE_ACCESS_TOKEN = process.env.FB_PAGE_ACCESS_TOKEN || '';
const APP_SECRET = process.env.FB_APP_SECRET || '';

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
export async function callSendAPI(recipientId: string, message: FBMessagePayload) {
  if (!PAGE_ACCESS_TOKEN) {
    console.error('[Messenger] PAGE_ACCESS_TOKEN ไม่ถูกตั้งค่า');
    return;
  }

  const url = `https://graph.facebook.com/v19.0/me/messages?access_token=${PAGE_ACCESS_TOKEN}`;

  const body = {
    recipient: { id: recipientId },
    message,
  };

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error('[Messenger] ส่งข้อความล้มเหลว', errText);
    }
  } catch (err) {
    console.error('[Messenger] เกิดข้อผิดพลาดในการเรียก Send API', err);
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