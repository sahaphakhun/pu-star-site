import { NextRequest, NextResponse } from 'next/server';
import { handleEvent } from '@/bot/flows/entry';
import { verifyRequestSignature } from '@/utils/messenger';

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

  // ประมวลผลแบบ async ไม่รอผล เพื่อให้ตอบกลับ Facebook เร็วที่สุด
  events.forEach((ev: any) => {
    handleEvent(ev).catch((err) => console.error('Handle event error', err));
  });

  // ส่ง response ทันทีเพื่อหลีกเลี่ยง timeout (10s limit)
  return NextResponse.json({ status: 'received' });
} 