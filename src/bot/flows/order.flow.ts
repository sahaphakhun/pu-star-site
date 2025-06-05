import { callSendAPIAsync, sendTypingOn } from '@/utils/messenger';
import { getSession, updateSession } from '../state';
import MessengerUser from '@/models/MessengerUser';
import connectDB from '@/lib/mongodb';

interface ShippingInfo {
  name: string;
  address: string;
}

export async function startCheckout(psid: string) {
  const session = await getSession(psid);
  if (session.cart.length === 0) {
    callSendAPIAsync(psid, { text: 'ตะกร้าสินค้าว่างอยู่ค่ะ' });
    return;
  }
  await sendTypingOn(psid);
  callSendAPIAsync(psid, { text: 'กรุณาพิมพ์ชื่อผู้รับสินค้า' });
  await updateSession(psid, { step: 'ask_name', tempData: {} });
}

export async function handleName(psid: string, name: string) {
  const sess = await getSession(psid);
  await updateSession(psid, { step: 'ask_address', tempData: { ...(sess.tempData || {}), name } });
  callSendAPIAsync(psid, { text: 'กรุณาพิมพ์ที่อยู่จัดส่งค่ะ' });
}

export async function handleAddress(psid: string, address: string) {
  const session = await getSession(psid);
  const name = (session.tempData as any)?.name || '';
  const shipping: ShippingInfo = { name, address };

  await sendTypingOn(psid);

  // สรุปออเดอร์ พร้อมแสดงหน่วย
  const itemsText = session.cart.map((c) => {
    let itemText = `• ${c.name} x${c.quantity}`;
    if (c.unitLabel) {
      itemText += ` (${c.unitLabel})`;
    }
    if (c.selectedOptions && Object.keys(c.selectedOptions).length > 0) {
      const optionsText = Object.entries(c.selectedOptions).map(([k, v]) => `${k}: ${v}`).join(', ');
      itemText += ` [${optionsText}]`;
    }
    return itemText;
  }).join('\n');
  const total = session.cart.reduce((s, i) => s + i.price * i.quantity, 0);

  callSendAPIAsync(psid, {
    text: `สรุปคำสั่งซื้อ\n${itemsText}\nยอดรวม ${total.toLocaleString()} บาท\nชื่อ: ${name}\nที่อยู่: ${address}`,
    quick_replies: [
      { content_type: 'text', title: 'ยืนยัน ✔️', payload: 'ORDER_CONFIRM' },
      { content_type: 'text', title: 'ยกเลิก', payload: 'ORDER_CANCEL' },
    ],
  });

  await updateSession(psid, { step: 'ask_payment', tempData: { ...shipping } });
}

export async function finalizeOrder(psid: string) {
  console.log('[FinalizeOrder] start for', psid);
  await connectDB();
  const session = await getSession(psid);
  console.log('[FinalizeOrder] session', JSON.stringify(session));
  const shipping = session.tempData as any as ShippingInfo & { paymentMethod?: string; slipUrl?: string };
  const total = session.cart.reduce((s, i) => s + i.price * i.quantity, 0);
  const items = session.cart.map((c) => ({
    productId: c.productId,
    name: c.name,
    price: c.price,
    quantity: c.quantity,
    selectedOptions: c.selectedOptions || {},
    unitLabel: c.unitLabel,
    unitPrice: c.unitPrice,
  }));

  // Log รายละเอียด payload เพื่อ debug โครงสร้างข้อมูล
  console.log('[FinalizeOrder] built items', JSON.stringify(items));

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
  if (shipping.paymentMethod) payload.paymentMethod = shipping.paymentMethod;
  if (shipping.slipUrl) payload.slipUrl = shipping.slipUrl;

  console.log('[FinalizeOrder] payload', JSON.stringify(payload));

  try {
    // สร้าง absolute URL ให้ถูกต้อง (Node fetch ไม่รองรับ relative path)
    const originEnv = process.env.SITE_URL || process.env.NEXT_PUBLIC_SITE_URL || process.env.VERCEL_URL || '';
    const origin = originEnv.startsWith('http') ? originEnv : `https://${originEnv.replace(/^https?:\/\//, '')}`;
    const res = await fetch(`${origin.replace(/\/$/, '')}/api/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const text = await res.text();
      console.error('[FinalizeOrder] API error', res.status, text);
      throw new Error(`API ${res.status}`);
    }

    callSendAPIAsync(psid, { text: 'สั่งซื้อสำเร็จ ขอบคุณค่ะ 🎉' });
  } catch (err) {
    console.error('[FinalizeOrder] fetch error', err);
    callSendAPIAsync(psid, { text: 'เกิดข้อผิดพลาดในการสร้างคำสั่งซื้อ กรุณาลองใหม่' });
  }

  // clear cart & reset step
  await updateSession(psid, { cart: [], step: 'browse', tempData: {} });
}

export async function askPayment(psid: string) {
  callSendAPIAsync(psid, {
    text: 'เลือกวิธีชำระเงินค่ะ',
    quick_replies: [
      { content_type: 'text', title: 'โอนเงิน', payload: 'PAY_TRANSFER' },
      { content_type: 'text', title: 'ปลายทาง', payload: 'PAY_COD' },
    ],
  });
  await updateSession(psid, { step: 'await_payment_method' });
}

export async function sendBankInfo(psid: string) {
  callSendAPIAsync(psid, { text: 'กรุณาโอนเงินตามรายละเอียด\nธนาคารกสิกรไทย\nเลขที่บัญชี 123-4-56789-0\nชื่อบัญชี NEXT STAR INNOVATIONS' });
  callSendAPIAsync(psid, { text: 'โอนเสร็จแล้ว โปรดอัปโหลดสลิปเป็นรูปภาพในแชทนี้ค่ะ' });
  await updateSession(psid, { step: 'await_slip' });
} 