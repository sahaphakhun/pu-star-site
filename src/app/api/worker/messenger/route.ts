import { NextRequest, NextResponse } from 'next/server';
import { handleEvent } from '@/bot/flows/entry';
import { verifyRequestSignature } from '@/utils/messenger';

// Worker route (Node runtime) รับ webhook หลังถูก forward จาก Edge

export async function POST(request: NextRequest) {
  const signature = request.headers.get('x-hub-signature-256') || undefined;
  const rawBody = await request.text();

  // ตรวจสอบ signature อีกครั้งเพื่อความปลอดภัย
  if (!verifyRequestSignature(rawBody, signature)) {
    console.warn('[Messenger Worker] ลายเซ็นไม่ผ่าน');
    return NextResponse.json({ status: 'invalid_signature' }, { status: 400 });
  }

  const body = JSON.parse(rawBody);

  if (body.object !== 'page') {
    return NextResponse.json({ status: 'ignored' });
  }

  const events = body.entry?.flatMap((e: any) => e.messaging) || [];
  try {
    await Promise.all(
      events.map((ev: any) => handleEvent(ev).catch((err) => console.error('Handle event error', err)))
    );
  } catch {}

  return NextResponse.json({ status: 'processed' });
} 