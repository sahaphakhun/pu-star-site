import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import LineNotificationGroup from '@/models/LineNotificationGroup';
import AdminNotification from '@/models/AdminNotification';
import AdminPhone from '@/models/AdminPhone';
import { sendSMS } from '@/app/notification';
import { verifyLineSignature, lineReply } from '@/utils/line';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const signature = request.headers.get('x-line-signature');
  const raw = await request.text();

  if (!verifyLineSignature(raw, signature)) {
    return NextResponse.json({ message: 'invalid signature' }, { status: 400 });
  }

  const body = JSON.parse(raw);
  const events = Array.isArray(body?.events) ? body.events : [];

  await connectDB();

  await Promise.allSettled(
    events.map(async (ev: any) => {
      if (ev.type === 'message' && ev.message?.type === 'text') {
        const text = String(ev.message.text || '').trim().toLowerCase();
        const src = ev.source || {};
        if ((src.type === 'group' || src.type === 'room') && text === '/setupnoti') {
          const groupId = src.groupId || src.roomId;
          const sourceType = src.type;
          if (groupId) {
            await LineNotificationGroup.findOneAndUpdate(
              { groupId },
              { groupId, sourceType, enabled: true },
              { upsert: true }
            );
            // ตอบกลับในกลุ่ม
            try {
              await lineReply(ev.replyToken, `✅ ตั้งค่ากลุ่มนี้เป็นกลุ่มแจ้งเตือนเรียบร้อย`);
            } catch {}

            // บันทึกการแจ้งเตือนสำหรับแอดมิน และส่ง SMS แจ้ง
            try {
              await AdminNotification.create({
                type: 'general',
                title: '🟢 ตั้งค่ากลุ่ม LINE สำหรับแจ้งเตือนแล้ว',
                message: `เพิ่มกลุ่มแจ้งเตือน LINE สำเร็จ (type: ${sourceType}, id: ${groupId})`,
                isGlobal: true,
                readBy: [],
              });

              const adminList = await AdminPhone.find({}, 'phoneNumber').lean();
              const smsMsg = 'ตั้งค่ากลุ่ม LINE สำหรับแจ้งเตือนแล้ว — ระบบจะเริ่มส่งแจ้งเตือนไปยังกลุ่มดังกล่าว';
              await Promise.allSettled(adminList.map((a: any) => sendSMS(a.phoneNumber, smsMsg)));
            } catch (e) {
              console.error('[LINE webhook] notify admin error', e);
            }
          }
        }
      }
    })
  );

  return NextResponse.json({ message: 'ok' });
}


