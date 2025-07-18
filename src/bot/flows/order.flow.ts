import { callSendAPIAsync, sendTypingOn } from '@/utils/messenger';
import { getSession, updateSession } from '../state';
import { startAuth } from './auth.flow';
import MessengerUser from '@/models/MessengerUser';
import connectDB from '@/lib/mongodb';
import { parseNameAddress } from '@/utils/nameAddressAI';
import { computeShippingFee } from '@/utils/shipping';
import { getProductById } from '@/utils/productCache';
import { transformImage } from '@utils/image';

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
    text: `สรุปคำสั่งซื้อ\n${itemsText}\nยอดสินค้า ${total.toLocaleString()} บาท\nค่าส่ง ${shippingFee.toLocaleString()} บาท\nรวมทั้งหมด ${grand.toLocaleString()} บาท\nชื่อ: ${name}\nที่อยู่: ${address}\n🚚จัดส่งสินค้าทุกวันจันทร์-ศุกร์ ตัดรอบ16:00น. หลังตัดรอบจัดส่งวันถัดไป\nอย่าลืมสะสมแต้มและรีวิวให้ด้วยนะคะ`,
    quick_replies: [
      { content_type: 'text', title: 'ยืนยัน ✔️', payload: 'ORDER_CONFIRM' }
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
  callSendAPIAsync(psid, {
    text: 'กรุณาโอนเงินตามรายละเอียด\nธนาคารกสิกรไทย\nเลขที่บัญชี 1943234902\nชื่อบัญชี บริษัท วินริช ไดนามิค จำกัด',
  });
  callSendAPIAsync(psid, { 
    text: 'โอนเสร็จแล้ว โปรดอัปโหลดสลิปเป็นรูปภาพในแชทนี้ค่ะ',
    quick_replies: [
      { content_type:'text', title:'เปลี่ยนวิธีชำระเงิน', payload:'CHANGE_PAYMENT' }
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
    text:`ยืนยันการสั่งซื้อ (ชำระเงินปลายทาง)\nยอดรวม ${grand.toLocaleString()} บาท`,
    quick_replies:[
      { content_type:'text', title:'ยืนยัน ✔️', payload:'COD_CONFIRM' },
      { content_type:'text', title:'เปลี่ยนวิธีชำระเงิน', payload:'CHANGE_PAYMENT' }
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

  // --- สร้าง carousel การ์ดสินค้าแต่ละชิ้น ---
  const elements = await Promise.all(session.cart.slice(0, 10).map(async (c, idx) => {
    const prod = await getProductById(c.productId);
    const image = prod?.imageUrl ? transformImage(prod.imageUrl) : 'https://raw.githubusercontent.com/facebook/instant-articles-builder/master/docs/assets/fb-icon.png';
    // ตรวจว่ามี option สีหรือไม่
    const hasColorOption = !!(prod?.options || []).find((o:any)=> o.name === 'สี' || o.name.toLowerCase() === 'color');
    let subtitle = `จำนวน ${c.quantity}`;
    if (c.unitLabel) subtitle += ` (${c.unitLabel})`;
    if (c.selectedOptions && Object.keys(c.selectedOptions).length > 0) {
      const opts = Object.entries(c.selectedOptions)
        .map(([k, v]) => `${k}: ${v}`)
        .join(', ');
      subtitle += ` | ${opts}`;
    }

    return {
      title: c.name.substring(0, 80), // ความยาวตามข้อจำกัด Facebook
      subtitle: subtitle.substring(0, 80),
      image_url: image,
      buttons: [
        {
          type: 'postback',
          title: 'เปลี่ยนจำนวน',
          payload: `EDIT_QTY_${idx}`,
        },
        ...(hasColorOption ? [{
          type: 'postback',
          title: 'เปลี่ยนสี',
          payload: `EDIT_COL_${idx}`,
        }] : []),
      ],
    };
  }));

  // คำนวณยอดรวม เพื่อใช้ใน element สรุป
  const totalTmp = session.cart.reduce((s, i) => s + i.price * i.quantity, 0);
  const shipTmp = await computeShippingFee(session.cart);
  const grandTmp = totalTmp + shipTmp;

  // เพิ่มการ์ดสรุปตะกร้าเป็น element ตัวแรก
  elements.unshift({
    title: '🛒 สรุปตะกร้า',
    subtitle: `ยอดรวม ${grandTmp.toLocaleString()} บาท`,
    image_url: 'https://raw.githubusercontent.com/facebook/instant-articles-builder/master/docs/assets/fb-icon.png',
    buttons: [
      { type: 'postback', title: 'ยืนยันสั่งซื้อ ✔️', payload: 'CONFIRM_CART' },
      { type: 'postback', title: 'ล้างตะกร้า', payload: 'CLEAR_CART' },
    ],
  });

  // ส่งข้อความแนะนำการแก้ไขจำนวนก่อน
  callSendAPIAsync(psid, { text: 'หากต้องการแก้ไขจำนวน ให้กดปุ่ม "เปลี่ยนจำนวน" ที่รายการสินค้านั้น แล้วพิมพ์ตัวเลขจำนวนที่ต้องการค่ะ' });

  // ส่ง carousel (รวมสรุป)
  callSendAPIAsync(psid, {
    attachment: {
      type: 'template',
      payload: {
        template_type: 'generic',
        image_aspect_ratio: 'square',
        elements,
      },
    },
  });

  // --- ส่งสรุปยอดและ quick replies ---
  const total = session.cart.reduce((s, i) => s + i.price * i.quantity, 0);
  const shippingFee = await computeShippingFee(session.cart);
  const grand = total + shippingFee;

  callSendAPIAsync(psid, {
    text: `ยอดรวม ${grand.toLocaleString()} บาท`,
    quick_replies: [
      { content_type: 'text', title: 'ยืนยันการสั่งซื้อ', payload: 'CONFIRM_CART' },
      { content_type: 'text', title: 'ล้างตะกร้า', payload: 'CLEAR_CART' },
      { content_type: 'text', title: 'ดูสินค้าเพิ่ม', payload: 'SHOW_PRODUCTS' },
    ],
  });

  await updateSession(psid, { step: 'summary' });
}

// ส่งตัวเลือกสีใหม่เมื่อกดปุ่มเปลี่ยนสี
export async function askColorOptions(psid: string, cartIdx: number) {
  const session = await getSession(psid);
  const item = session.cart[cartIdx];
  if (!item) return;
  const prod = await getProductById(item.productId);
  const colorOpt = (prod?.options || []).find((o:any)=> o.name === 'สี' || o.name.toLowerCase()==='color');
  if (!colorOpt) return;

  callSendAPIAsync(psid, {
    text: 'เลือกสีใหม่',
    quick_replies: colorOpt.values.slice(0,11).map((v:any)=>({
      content_type:'text',
      title: v.label.substring(0,20),
      payload: `SET_COL_${cartIdx}_${encodeURIComponent(v.label)}`,
    })),
  });
  await updateSession(psid, { step: 'await_color' });
} 