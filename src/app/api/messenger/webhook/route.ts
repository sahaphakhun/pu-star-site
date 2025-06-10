import { NextRequest, NextResponse } from 'next/server';
import { handleEvent } from '@/bot/flows/entry';
import { verifyRequestSignature } from '@/utils/messenger';

// Edge Webhook: ตอบ Facebook เร็วที่สุด แล้ว forward ไปยัง worker (Node)

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  // Debug log ตรวจสอบค่า verify
  console.log('[Webhook Verify] params', {
    mode,
    token,
    envToken: process.env.FB_VERIFY_TOKEN,
    challenge,
  });

  if (mode === 'subscribe' && token === process.env.FB_VERIFY_TOKEN) {
    return new NextResponse(challenge || '', { status: 200 });
  }
  return new NextResponse('Forbidden', { status: 403 });
}

export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  const signature = request.headers.get('x-hub-signature-256') || undefined;

  // ตรวจสอบ signature
  if (!verifyRequestSignature(rawBody, signature)) {
    console.warn('[Webhook] invalid signature');
    return new NextResponse('invalid_signature', { status: 400 });
  }

  const body = JSON.parse(rawBody);
  console.log('[Webhook] Received body', JSON.stringify(body));

  if (body.object !== 'page') {
    return NextResponse.json({ status: 'ignored' });
  }

  const events = body.entry?.flatMap((e: any) => e.messaging) || [];
  console.log('[Webhook] Total events', events.length);

  await Promise.all(
    events.map((ev: any) => handleEvent(ev).catch((err) => console.error('Handle event error', err)))
  );

  return NextResponse.json({ status: 'processed' });
} 