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
  if (!ACCESS_TOKEN) throw new Error('LINE_CHANNEL_ACCESS_TOKEN is missing');
  const messages = Array.isArray(message)
    ? message
    : [{ type: 'text', text: typeof message === 'string' ? message : '' }];
  const res = await fetch(`${LINE_API_BASE}/message/push`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${ACCESS_TOKEN}`,
    },
    body: JSON.stringify({ to, messages }),
  });
  if (!res.ok) throw new Error(`LINE push error ${res.status}: ${await res.text()}`);
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


