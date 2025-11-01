import connectDB from '@/lib/mongodb';
import LineNotificationGroup from '@/models/LineNotificationGroup';
import { linePush } from './line';

export async function notifyLineGroupsNewOrder(order: any) {
  console.log('[LINE Notification] เริ่มส่งแจ้งเตือนออเดอร์ใหม่:', order._id);
  
  try {
    await connectDB();
    console.log('[LINE Notification] เชื่อมต่อ DB สำเร็จ');
    
    const groups = await LineNotificationGroup.find({ enabled: true }).lean();
    console.log('[LINE Notification] พบกลุ่มที่ตั้งค่าไว้:', groups.length, 'กลุ่ม');
    
    if (!groups.length) {
      console.log('[LINE Notification] ไม่มีกลุ่มที่ตั้งค่าไว้ - ข้ามการส่ง');
      return;
    }

    const shortId = order._id?.toString?.().slice(-8).toUpperCase() || '';
    const amount = (order.totalAmount ?? 0).toLocaleString();
    const urlBase = (process.env.NEXT_PUBLIC_SITE_URL || '').replace(/\/$/, '');
    const adminUrl = urlBase ? `${urlBase}/admin/orders` : '';
    const msg = [
      `🛒 มีออเดอร์ใหม่ #${shortId}`,
      `ยอดรวม: ฿${amount}`,
      order.customerName ? `ลูกค้า: ${order.customerName}` : undefined,
      adminUrl ? `ดูในระบบ: ${adminUrl}` : undefined,
    ]
      .filter(Boolean)
      .join('\n');

    console.log('[LINE Notification] ข้อความที่จะส่ง:', msg);
    console.log('[LINE Notification] ส่งไปยังกลุ่ม:', groups.map(g => ({ groupId: g.groupId, sourceType: g.sourceType })));

    const results = await Promise.allSettled(groups.map((g: any) => linePush(g.groupId, msg)));
    
    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        console.log(`[LINE Notification] ส่งไปกลุ่ม ${groups[index].groupId} สำเร็จ`);
      } else {
        console.error(`[LINE Notification] ส่งไปกลุ่ม ${groups[index].groupId} ล้มเหลว:`, result.reason);
      }
    });
    
    console.log('[LINE Notification] ส่งแจ้งเตือนเสร็จสิ้น');
  } catch (error) {
    console.error('[LINE Notification] เกิดข้อผิดพลาด:', error);
    throw error;
  }
}

export async function notifyLineGroupsNewQuote(quote: any) {
  await connectDB();
  const groups = await LineNotificationGroup.find({ enabled: true }).lean();
  if (!groups.length) return;

  const shortId = quote._id?.toString?.().slice(-8).toUpperCase() || '';
  const amount = (quote.totalAmount ?? 0).toLocaleString();
  const urlBase = (process.env.NEXT_PUBLIC_SITE_URL || '').replace(/\/$/, '');
  const adminUrl = urlBase ? `${urlBase}/admin/quote-requests` : '';
  const msg = [
    `💼 มีคำขอใบเสนอราคาใหม่ #${shortId}`,
    `ยอดประมาณการ: ฿${amount}`,
    quote.customerName ? `ลูกค้า: ${quote.customerName}` : undefined,
    adminUrl ? `ดูในระบบ: ${adminUrl}` : undefined,
  ]
    .filter(Boolean)
    .join('\n');

  await Promise.allSettled(groups.map((g: any) => linePush(g.groupId, msg)));
}

export async function notifyLineGroupsNewClaim(order: any) {
  await connectDB();
  const groups = await LineNotificationGroup.find({ enabled: true }).lean();
  if (!groups.length) return;

  const shortId = order?._id?.toString?.().slice(-8).toUpperCase() || '';
  const customerName = order?.customerName ? `ลูกค้า: ${order.customerName}` : undefined;
  const reason = order?.claimInfo?.claimReason ? `เหตุผล: ${order.claimInfo.claimReason}` : undefined;
  const urlBase = (process.env.NEXT_PUBLIC_SITE_URL || '').replace(/\/$/, '');
  const adminUrl = urlBase ? `${urlBase}/admin/orders/claims` : '';

  const msg = ['🚨 มีเคสเคลมใหม่', shortId && `ออเดอร์ #${shortId}`, customerName, reason, adminUrl && `ดูในระบบ: ${adminUrl}`]
    .filter(Boolean)
    .join('\n');

  await Promise.allSettled(groups.map((g: any) => linePush(g.groupId, msg)));
}


