import { NextRequest, NextResponse } from 'next/server';
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

  let body: any;
  try {
    body = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ status: 'invalid_body' }, { status: 400 });
  }

  console.log('[Webhook] Received body', JSON.stringify(body));

  if (body.object !== 'page') {
    return NextResponse.json({ status: 'ignored' });
  }

  // Forward events to appropriate workers
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://www.winrichdynamic.com';

  // ตรวจสอบว่ามี comment events หรือไม่
  const hasCommentEvents = body.entry?.some((entry: any) =>
    entry.changes?.some((change: any) => change.field === 'feed')
  );

  if (hasCommentEvents) {
    // Forward to comment worker
    fetch(`${baseUrl}/api/worker/facebook-comments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-hub-signature-256': signature || '',
      },
      body: rawBody,
    }).catch((err) => console.error('[Webhook] comment worker error', err));
  }

  // Forward to messenger worker (existing)
  fetch(`${baseUrl}/api/worker/messenger`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-hub-signature-256': signature || '',
    },
    body: rawBody,
  }).catch((err) => console.error('[Webhook] messenger worker error', err));

  // ตอบกลับ Facebook ทันที
  return NextResponse.json({ status: 'accepted' });
}