import { NextRequest, NextResponse } from 'next/server';
import { handleEvent } from '@/bot/flows/entry';
import { verifyRequestSignature } from '@/utils/messenger';

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  if (mode === 'subscribe' && token === process.env.FB_VERIFY_TOKEN) {
    return new NextResponse(challenge || '', { status: 200 });
  }
  return new NextResponse('Forbidden', { status: 403 });
}

export async function POST(request: NextRequest) {
  const signature = request.headers.get('x-hub-signature-256') || undefined;
  const rawBody = await request.text();

  // ตรวจสอบ signature (ข้ามถ้า APP_SECRET ไม่ตั้ง)
  if (!verifyRequestSignature(rawBody, signature)) {
    console.warn('[Messenger] ลายเซ็นไม่ผ่าน หรือ APP_SECRET ว่าง');
  }

  const body = JSON.parse(rawBody);

  if (body.object !== 'page') {
    return NextResponse.json({ status: 'ignored' });
  }

  const events = body.entry?.flatMap((e: any) => e.messaging) || [];
  for (const ev of events) {
    try {
      await handleEvent(ev);
    } catch (err) {
      console.error('Handle event error', err);
    }
  }

  return NextResponse.json({ status: 'ok' });
} 