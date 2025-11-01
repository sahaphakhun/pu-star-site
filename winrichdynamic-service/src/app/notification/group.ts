import LineGroupLink from '@/models/LineGroupLink';
import { sendLineTextToGroup } from './line';

/**
 * ส่งข้อความไปยัง LINE กลุ่มที่ผูกกับลูกค้ารายนั้น (อาจมีหลายกลุ่ม)
 */
export async function sendLineTextToCustomerGroups(customerId: string, text: string) {
  if (!customerId || !text) return;
  try {
    const links = await LineGroupLink.find({ customerId: String(customerId) }).lean();
    for (const link of links) {
      const groupId = (link as any).groupId as string;
      if (!groupId) continue;
      try {
        await sendLineTextToGroup(groupId, text);
      } catch (e) {
        console.warn('[Line Group Notify] ส่งไม่สำเร็จสำหรับ groupId:', groupId, e);
      }
    }
  } catch (err) {
    console.error('[Line Group Notify] ดึง group links ไม่สำเร็จ:', err);
  }
}

