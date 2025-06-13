import { callSendAPIAsync, sendTypingOn } from '@/utils/messenger';
import { getSession, updateSession } from '../state';
import { startAuth } from './auth.flow';
import MessengerUser from '@/models/MessengerUser';
import connectDB from '@/lib/mongodb';
import { parseNameAddress } from '@/utils/nameAddressAI';
import ShippingSetting from '@/models/ShippingSetting';
import { getProductById } from '@/utils/productCache';

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
  // ข้ามไปขั้นตอนยืนยันเบอร์โทรทันที
  await startAuth(psid);
}

export async function handleName(psid: string, name: string) {
  // เก็บชื่อผู้รับไว้ แล้วเข้าสู่ขั้นตอนยืนยันเบอร์โทร (OTP)
  const sess = await getSession(psid);
  await updateSession(psid, { tempData: { ...(sess.tempData || {}), name } });

  // ใช้ flow ยืนยันตัวตนเพื่อขอเบอร์โทรและ OTP
  return startAuth(psid);
}

// รับข้อความเดียวที่รวมชื่อและที่อยู่ (แยกด้วยขึ้นบรรทัดใหม่)
export async function handleNameAddress(psid: string, fullText: string) {
  // ใช้ OpenAI แยกชื่อและที่อยู่
  const parsed = await parseNameAddress(fullText);

  if (!parsed) {
    return callSendAPIAsync(psid, {
      text: 'ขออภัย ไม่สามารถแยกชื่อและที่อยู่ได้ กรุณาพิมพ์ใหม่ เช่น:\nสมชาย ใจดี \n123/45 หมู่ 5 ต.บางรัก ...',
    });
  }

  return handleAddress(psid, parsed.address, parsed.name);
}

// ปรับ handleAddress ให้รับชื่อ optional (กรณีมาจาก handleNameAddress)
export async function handleAddress(psid: string, address: string, nameOverride?: string) {
  const session = await getSession(psid);
  const name = nameOverride || (session.tempData as any)?.name || '';
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
  const shippingFee = await computeShippingFee(session.cart);
  const grand = total + shippingFee;

  callSendAPIAsync(psid, {
    text: `สรุปคำสั่งซื้อ\n${itemsText}\nยอดสินค้า ${total.toLocaleString()} บาท\nค่าส่ง ${shippingFee.toLocaleString()} บาท\nรวมทั้งหมด ${grand.toLocaleString()} บาท\nชื่อ: ${name}\nที่อยู่: ${address}`,
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
  const shippingFee = await computeShippingFee(session.cart);
  const grandTotal = total + shippingFee;

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
    shippingFee,
    discount: 0,
    totalAmount: grandTotal,
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
  callSendAPIAsync(psid, { 
    text: 'โอนเสร็จแล้ว โปรดอัปโหลดสลิปเป็นรูปภาพในแชทนี้ค่ะ',
    quick_replies: [
      { content_type:'text', title:'เปลี่ยนวิธีชำระเงิน', payload:'CHANGE_PAYMENT' },
      { content_type:'text', title:'ยกเลิก', payload:'ORDER_CANCEL' }
    ]
  });
  await updateSession(psid, { step: 'await_slip' });
}

// ยืนยัน COD ก่อนสร้างออเดอร์ เพื่อให้ผู้ใช้เปลี่ยนใจได้
export async function confirmCOD(psid:string){
  const session = await getSession(psid);
  const total = session.cart.reduce((s,i)=>s+i.price*i.quantity,0);
  const shippingFee = await computeShippingFee(session.cart);
  const grand = total + shippingFee;
  callSendAPIAsync(psid, {
    text:`ยืนยันการสั่งซื้อ (ชำระเงินปลายทาง)\nยอดสินค้า ${total.toLocaleString()} บาท\nค่าส่ง ${shippingFee.toLocaleString()} บาท\nรวมทั้งหมด ${grand.toLocaleString()} บาท`,
    quick_replies:[
      { content_type:'text', title:'ยืนยัน ✔️', payload:'COD_CONFIRM' },
      { content_type:'text', title:'เปลี่ยนวิธีชำระเงิน', payload:'CHANGE_PAYMENT' },
      { content_type:'text', title:'ยกเลิก', payload:'ORDER_CANCEL' }
    ]
  });
  await updateSession(psid, { step:'await_cod_confirm' });
}

// แสดงตะกร้าสินค้าแบบสรุป พร้อมตัวเลือกจัดการ
export async function showCart(psid: string) {
  const session = await getSession(psid);
  if (session.cart.length === 0) {
    return callSendAPIAsync(psid, { text: 'ตะกร้าสินค้าว่างอยู่ค่ะ' });
  }

  // สร้างข้อความสรุปรายการ พร้อมลำดับ
  const itemsText = session.cart
    .map((c, idx) => {
      let t = `${idx + 1}) ${c.name} x${c.quantity}`;
      if (c.unitLabel) t += ` (${c.unitLabel})`;
      return t;
    })
    .join('\n');

  const total = session.cart.reduce((s, i) => s + i.price * i.quantity, 0);
  const shippingFee = await computeShippingFee(session.cart);
  const grand = total + shippingFee;

  // เตรียม quick replies: ลบแต่ละชิ้น (สูงสุด 8), ยืนยัน, ล้างตะกร้า
  const removeReplies = session.cart.slice(0, 8).map((_, idx) => ({
    content_type: 'text',
    title: `ลบ ${idx + 1}`,
    payload: `REMOVE_${idx}`,
  }));

  callSendAPIAsync(psid, {
    text: `ตะกร้าของคุณ\n${itemsText}\nยอดรวม: ${total.toLocaleString()} บาท\nค่าส่ง: ${shippingFee.toLocaleString()} บาท\nรวมทั้งหมด: ${grand.toLocaleString()} บาท`,
    quick_replies: [
      { content_type: 'text', title: 'ยืนยันการสั่งซื้อ', payload: 'CONFIRM_CART' },
      ...removeReplies,
      { content_type: 'text', title: 'ล้างตะกร้า', payload: 'CLEAR_CART' },
    ],
  });

  await updateSession(psid, { step: 'summary' });
}

// Helper: คำนวณค่าส่งตามหน่วย + maxFee
async function computeShippingFee(cart: any[]): Promise<number> {
  if (cart.length === 0) return 0;
  await connectDB();
  const setting = (await ShippingSetting.findOne().lean()) as any || { maxFee:50 };
  const maxFee:number = setting.maxFee ?? 50;

  const unitFees: number[] = [];
  for (const c of cart) {
    if (!c.unitLabel) continue;
    const prod = await getProductById(c.productId);
    if (prod?.units) {
      const u = prod.units.find((un:any)=>un.label===c.unitLabel);
      if (u && typeof u.shippingFee==='number') unitFees.push(u.shippingFee);
    }
  }
  const fee = unitFees.length ? Math.max(...unitFees) : 0;
  return Math.min(maxFee, fee);
} 