import { callSendAPIAsync, sendTypingOn } from '@/utils/messenger';
import { getSession, updateSession } from '../state';
import MessengerUser from '@/models/MessengerUser';
import connectDB from '@/lib/mongodb';

interface ShippingInfo {
  name: string;
  address: string;
}

export async function startCheckout(psid: string) {
  const session = getSession(psid);
  if (session.cart.length === 0) {
    callSendAPIAsync(psid, { text: 'ตะกร้าสินค้าว่างอยู่ค่ะ' });
    return;
  }
  await sendTypingOn(psid);
  callSendAPIAsync(psid, { text: 'กรุณาพิมพ์ชื่อผู้รับสินค้า' });
  updateSession(psid, { step: 'ask_name', tempData: {} });
}

export async function handleName(psid: string, name: string) {
  const sess = getSession(psid);
  updateSession(psid, { step: 'ask_address', tempData: { ...(sess.tempData || {}), name } });
  callSendAPIAsync(psid, { text: 'กรุณาพิมพ์ที่อยู่จัดส่งค่ะ' });
}

export async function handleAddress(psid: string, address: string) {
  const session = getSession(psid);
  const name = (session.tempData as any)?.name || '';
  const shipping: ShippingInfo = { name, address };

  await sendTypingOn(psid);

  // สรุปออเดอร์
  const itemsText = session.cart.map((c) => `• ${c.name} x${c.quantity}`).join('\n');
  const total = session.cart.reduce((s, i) => s + i.price * i.quantity, 0);

  callSendAPIAsync(psid, {
    text: `สรุปคำสั่งซื้อ\n${itemsText}\nยอดรวม ${total.toLocaleString()} บาท\nชื่อ: ${name}\nที่อยู่: ${address}`,
    quick_replies: [
      { content_type: 'text', title: 'ยืนยัน ✔️', payload: 'ORDER_CONFIRM' },
      { content_type: 'text', title: 'ยกเลิก', payload: 'ORDER_CANCEL' },
    ],
  });

  updateSession(psid, { step: 'confirm_order', tempData: { ...shipping } });
}

export async function finalizeOrder(psid: string) {
  await connectDB();
  const session = getSession(psid);
  const shipping = session.tempData as unknown as ShippingInfo;
  const total = session.cart.reduce((s, i) => s + i.price * i.quantity, 0);
  const items = session.cart.map((c) => ({
    productId: c.productId,
    name: c.name,
    price: c.price,
    quantity: c.quantity,
  }));

  // หา userId & phone จาก MessengerUser
  const mu = await MessengerUser.findOne({ psid });
  const payload: any = {
    customerName: shipping.name,
    customerPhone: mu?.phoneNumber || '000',
    customerAddress: shipping.address,
    items,
    shippingFee: 0,
    discount: 0,
    totalAmount: total,
  };
  if (mu?.userId) payload.userId = mu.userId;

  try {
    await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || ''}/api/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    callSendAPIAsync(psid, { text: 'สั่งซื้อสำเร็จ ขอบคุณค่ะ 🎉' });
  } catch (err) {
    callSendAPIAsync(psid, { text: 'เกิดข้อผิดพลาดในการสร้างคำสั่งซื้อ กรุณาลองใหม่' });
  }

  // clear cart & reset step
  updateSession(psid, { cart: [], step: 'browse', tempData: {} });
} 