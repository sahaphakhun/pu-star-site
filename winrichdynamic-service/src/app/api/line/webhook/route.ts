import { NextRequest, NextResponse } from 'next/server';
import { Client, validateSignature } from '@line/bot-sdk';

export const dynamic = 'force-dynamic';

function getLineClient(): Client {
  const channelAccessToken = process.env.LINE_CHANNEL_ACCESS_TOKEN;
  if (!channelAccessToken) {
    throw new Error('LINE_CHANNEL_ACCESS_TOKEN is not set');
  }
  return new Client({ channelAccessToken });
}

export async function POST(request: NextRequest) {
  try {
    const channelSecret = process.env.LINE_CHANNEL_SECRET;
    if (!channelSecret) {
      return NextResponse.json({ error: 'LINE channel secret not configured' }, { status: 500 });
    }

    const signature = request.headers.get('x-line-signature') || '';
    const bodyText = await request.text();

    // Validate signature
    const isValid = validateSignature(bodyText, channelSecret, signature);
    if (!isValid) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const body = JSON.parse(bodyText);
    const events: any[] = body.events || [];

    const client = getLineClient();

    await Promise.all(
      events.map(async (event: any) => {
        try {
          if (event.type !== 'message') return;
          if (!event.message || event.message.type !== 'text') return;

          // ตอบในกลุ่มเท่านั้นตามที่ร้องขอ
          if (event.source?.type !== 'group') return;

          const text: string = (event.message.text || '').trim();
          if (text === 'สวัสดี') {
            await client.replyMessage(event.replyToken, {
              type: 'text',
              text: 'สวัสดี'
            });
          }
        } catch (err) {
          console.error('[LINE Webhook] Error handling event:', err);
        }
      })
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[LINE Webhook] Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}


