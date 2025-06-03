import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

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

  // ส่งไปยัง worker แบบ fire-and-forget
  const workerUrl = `${request.nextUrl.origin}/api/worker/messenger`;
  const signature = request.headers.get('x-hub-signature-256') || '';

  fetch(workerUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-hub-signature-256': signature,
    },
    body: rawBody,
  }).catch(() => {});

  // ตอบทันทีให้ FB ไม่ timeout (10 s limit)
  return NextResponse.json({ status: 'accepted' });
} 