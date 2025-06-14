import connectDB from '@/lib/mongodb';
import ShippingSetting from '@/models/ShippingSetting';
import { getProductById } from '@/utils/productCache';

// simple in-memory cache for 5 minutes
let cachedSetting: any = null;
let cachedAt = 0;

async function getSetting() {
  const now = Date.now();
  if (cachedSetting && now - cachedAt < 300_000) return cachedSetting;
  await connectDB();
  cachedSetting = (await ShippingSetting.findOne().lean()) as any;
  if (!cachedSetting) {
    cachedSetting = { fee: 50, maxFee: 50, freeThreshold: 0, freeQuantityThreshold: 0 };
  }
  cachedAt = now;
  return cachedSetting;
}

export async function computeShippingFee(cart: any[]): Promise<number> {
  if (!cart || cart.length === 0) return 0;

  const setting = await getSetting();
  const freeThreshold: number = setting.freeThreshold ?? 0;
  const baseFee: number = setting.fee ?? 50;
  const freeQtyThreshold: number = setting.freeQuantityThreshold ?? 0;
  const maxFee: number = setting.maxFee ?? 50;

  const totalAmount = cart.reduce((sum: number, i: any) => sum + i.price * i.quantity, 0);
  const totalQty = cart.reduce((sum: number, i: any) => sum + i.quantity, 0);

  // เงื่อนไขส่งฟรี
  if (totalAmount >= freeThreshold || totalQty >= freeQtyThreshold) {
    return 0;
  }

  const candidateFees: number[] = [];
  for (const c of cart) {
    let itemFee: number | undefined;
    // กรณีมี unit → ดูค่าส่งระดับ unit ก่อน
    if (c.unitLabel) {
      const prod = await getProductById(c.productId);
      const u = prod?.units?.find((un: any) => un.label === c.unitLabel);
      if (u && typeof u.shippingFee === 'number') itemFee = u.shippingFee;
    }
    // ถ้า unit ไม่กำหนด ลองดูที่ระดับ product
    if (itemFee === undefined) {
      const prod = await getProductById(c.productId);
      if (prod && typeof (prod as any).shippingFee === 'number') {
        itemFee = (prod as any).shippingFee;
      }
    }
    // ถ้าไม่เจออะไรเลย → ใช้ baseFee
    if (itemFee === undefined) itemFee = baseFee;

    candidateFees.push(itemFee);
  }

  let fee = Math.max(...candidateFees);
  if (fee < 0) fee = 0;

  return Math.min(maxFee, fee);
} 