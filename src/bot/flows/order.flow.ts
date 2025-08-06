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
  deliveryMethod?: 'standard' | 'lalamove';
  deliveryLocation?: {
    latitude: number;
    longitude: number;
    mapDescription?: string;
  };
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

  // ถ้ามีการส่ง address มาแล้ว แสดงว่าผู้ใช้เลือกที่อยู่แล้ว หรือกรอกที่อยู่ใหม่แล้ว
  if (address) {
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

    // ถามเลือกช่องทางการส่ง
    callSendAPIAsync(psid, {
      text: `📦 สรุปคำสั่งซื้อ\n${itemsText}\nยอดสินค้า ${total.toLocaleString()} บาท\nค่าส่ง ${shippingFee.toLocaleString()} บาท\nรวมทั้งหมด ${grand.toLocaleString()} บาท\n\nชื่อ: ${name}\nที่อยู่: ${address}\n\n🚚 กรุณาเลือกช่องทางการส่ง:`,
      quick_replies: [
        { content_type: 'text', title: '📦 การส่งปกติ', payload: 'DELIVERY_STANDARD' },
        { content_type: 'text', title: '🏍️ Lalamove ส่งด่วน', payload: 'DELIVERY_LALAMOVE' }
      ],
    });

    await updateSession(psid, { step: 'ask_delivery_method', tempData: { ...shipping } });
    return;
  }

  // ดึงที่อยู่ที่บันทึกไว้ (ถ้ามี)
  try {
    await connectDB();
    const mu = await MessengerUser.findOne({ psid });
    if (mu?.userId) {
      // ถ้ามี userId แสดงว่าเป็นผู้ใช้ที่ลงทะเบียนแล้ว
      // ดึงข้อมูลที่อยู่ที่บันทึกไว้
      const originEnv = process.env.SITE_URL || process.env.NEXT_PUBLIC_SITE_URL || 'https://www.winrichdynamic.com';
      const origin = originEnv.startsWith('http') ? originEnv : `https://${originEnv.replace(/^https?:\/\//, '')}`;
      const res = await fetch(`${origin.replace(/\/$/, '')}/api/auth/me`, {
        headers: { Cookie: `userId=${mu.userId}` }
      });
      
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.user.addresses && data.user.addresses.length > 0) {
          // แสดงที่อยู่ที่บันทึกไว้ให้เลือก
          const addressOptions = data.user.addresses.map((addr: any, idx: number) => {
            let label = addr.label;
            if (addr.isDefault) label += ' (ค่าเริ่มต้น)';
            return {
              content_type: 'text',
              title: label.substring(0, 20),
              payload: `SELECT_ADDR_${idx}`
            };
          });
          
          // เพิ่มตัวเลือกกรอกที่อยู่ใหม่
          addressOptions.push({
            content_type: 'text',
            title: '📝 กรอกที่อยู่ใหม่',
            payload: 'NEW_ADDRESS'
          });
          
          // เก็บที่อยู่ทั้งหมดไว้ใน session
          await updateSession(psid, { 
            tempData: { 
              ...session.tempData, 
              savedAddresses: data.user.addresses,
              name
            } 
          });
          
          callSendAPIAsync(psid, {
            text: 'เลือกที่อยู่จัดส่ง:',
            quick_replies: addressOptions.slice(0, 11) // จำกัดไม่เกิน 11 ตัวเลือก
          });
          
          return;
        }
      }
    }
  } catch (error) {
    console.error('Error fetching saved addresses:', error);
  }
  
  // ถ้าไม่มีที่อยู่ที่บันทึกไว้ หรือไม่สามารถดึงข้อมูลได้ ให้ขอที่อยู่ใหม่
  return promptNewAddress(psid);
}

// จัดการการเลือก delivery method
export async function handleDeliveryMethod(psid: string, method: 'standard' | 'lalamove') {
  const session = await getSession(psid);
  const shipping = session.tempData as any as ShippingInfo;
  shipping.deliveryMethod = method;

  if (method === 'lalamove') {
    // ถาม location สำหรับ Lalamove
    callSendAPIAsync(psid, {
      text: `🏍️ เลือก Lalamove ส่งด่วน (กทม.-ปริมณฑล)\n\n📍 กรุณาส่งตำแหน่งปักหมุดของคุณเพื่อให้ Lalamove รับของได้อย่างแม่นยำ\n\nคุณสามารถ:\n1️⃣ แชร์ตำแหน่งปัจจุบัน (กดปุ่ม + แล้วเลือก Location)\n2️⃣ หรือพิมพ์พิกัด เช่น "13.756331, 100.501765 สำนักงานใหญ่"`,
      quick_replies: [
        { content_type: 'location' }
      ]
    });
    await updateSession(psid, { step: 'ask_lalamove_location', tempData: shipping });
  } else {
    // การส่งปกติ ไปต่อที่ payment method
    shipping.deliveryMethod = 'standard';
    callSendAPIAsync(psid, {
      text: `📦 เลือกการส่งปกติ\n\n💰 กรุณาเลือกวิธีการชำระเงิน:`,
      quick_replies: [
        { content_type: 'text', title: '💵 เก็บเงินปลายทาง', payload: 'PAYMENT_COD' },
        { content_type: 'text', title: '🏦 โอนเงิน', payload: 'PAYMENT_TRANSFER' }
      ]
    });
    await updateSession(psid, { step: 'ask_payment', tempData: shipping });
  }
}

// จัดการ location สำหรับ Lalamove
export async function handleLalamoveLocation(psid: string, latitude: number, longitude: number, description?: string) {
  const session = await getSession(psid);
  const shipping = session.tempData as any as ShippingInfo;
  
  shipping.deliveryLocation = {
    latitude,
    longitude,
    mapDescription: description || 'ตำแหน่งที่เลือก'
  };

  callSendAPIAsync(psid, {
    text: `📍 ตำแหน่งที่รับ: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}\n${description ? `📝 ${description}` : ''}\n\n💰 กรุณาเลือกวิธีการชำระเงิน:`,
    quick_replies: [
      { content_type: 'text', title: '💵 เก็บเงินปลายทาง', payload: 'PAYMENT_COD' },
      { content_type: 'text', title: '🏦 โอนเงิน', payload: 'PAYMENT_TRANSFER' }
    ]
  });

  await updateSession(psid, { step: 'ask_payment', tempData: shipping });
}

// จัดการ text input สำหรับ coordinates
export async function handleCoordinatesText(psid: string, text: string) {
  // Parse coordinates from text like "13.756331, 100.501765" or "13.756331, 100.501765 description"
  const coordPattern = /(-?\d+\.?\d*),\s*(-?\d+\.?\d*)\s*(.*)/;
  const match = text.match(coordPattern);
  
  if (match) {
    const latitude = parseFloat(match[1]);
    const longitude = parseFloat(match[2]);
    const description = match[3].trim() || 'ตำแหน่งที่ระบุ';
    
    if (latitude >= -90 && latitude <= 90 && longitude >= -180 && longitude <= 180) {
      await handleLalamoveLocation(psid, latitude, longitude, description);
      return;
    }
  }
  
  callSendAPIAsync(psid, {
    text: `❌ รูปแบบพิกัดไม่ถูกต้อง\n\nกรุณาพิมพ์ในรูปแบบ: "latitude, longitude คำอธิบาย"\nเช่น: "13.756331, 100.501765 สำนักงาน"\n\nหรือแชร์ตำแหน่งปัจจุบันของคุณ`,
    quick_replies: [
      { content_type: 'location' }
    ]
  });
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
    deliveryMethod: shipping.deliveryMethod || 'standard',
    items,
    shippingFee,
    discount: 0,
    totalAmount: grandTotal,
  };
  if (mu?.userId) payload.userId = mu.userId;
  if (shipping.paymentMethod) payload.paymentMethod = shipping.paymentMethod;
  if (shipping.slipUrl) payload.slipUrl = shipping.slipUrl;
  if (shipping.deliveryLocation) payload.deliveryLocation = shipping.deliveryLocation;

  console.log('[FinalizeOrder] payload', JSON.stringify(payload));

  try {
    // สร้าง absolute URL ให้ถูกต้อง (Node fetch ไม่รองรับ relative path)
    const originEnv = process.env.SITE_URL || process.env.NEXT_PUBLIC_SITE_URL || 'https://www.winrichdynamic.com';
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

    // ดึงข้อมูลคำสั่งซื้อที่สร้างเสร็จแล้ว
    const orderResult = await res.json();
    const orderId = orderResult._id ? orderResult._id.slice(-8).toUpperCase() : 'N/A';
    
    // แสดงข้อความยืนยันการสั่งซื้อพร้อมหมายเลขคำสั่งซื้อ
    callSendAPIAsync(psid, { 
      text: `🎉 สั่งซื้อสำเร็จ!\n\n📦 หมายเลขคำสั่งซื้อ: ${orderId}\n\nวิธีชำระเงิน: ${shipping.paymentMethod === 'transfer' ? 'โอนเงิน' : 'เก็บเงินปลายทาง'}\nยอดรวมทั้งสิ้น: ${grandTotal.toLocaleString()} บาท\n\nขอบคุณที่ใช้บริการค่ะ\nเราจะจัดส่งสินค้าให้เร็วที่สุด` 
    });
    
    // ส่งข้อความเพิ่มเติมเกี่ยวกับการติดตามคำสั่งซื้อ
    callSendAPIAsync(psid, {
      text: 'คุณสามารถตรวจสอบสถานะคำสั่งซื้อได้ที่เว็บไซต์ของเรา หรือสอบถามเพิ่มเติมได้ที่แชทนี้',
      quick_replies: [
        { content_type: 'text', title: '🛍️ สั่งซื้อเพิ่ม', payload: 'SHOW_PRODUCTS' },
        { content_type: 'text', title: '❓ ติดต่อพนักงาน', payload: 'CONTACT_STAFF' }
      ]
    });
  } catch (err) {
    console.error('[FinalizeOrder] fetch error', err);
    callSendAPIAsync(psid, { text: 'เกิดข้อผิดพลาดในการสร้างคำสั่งซื้อ กรุณาลองใหม่' });
  }

  // clear cart & reset step
  await updateSession(psid, { cart: [], step: 'browse', tempData: {} });
}

// ฟังก์ชันสำหรับจัดการการเลือกที่อยู่ที่บันทึกไว้
export async function handleSavedAddressSelection(psid: string, addressIndex: number) {
  const session = await getSession(psid);
  const savedAddresses = (session.tempData as any)?.savedAddresses || [];
  const selectedAddress = savedAddresses[addressIndex];
  
  if (!selectedAddress) {
    return callSendAPIAsync(psid, { text: 'ไม่พบที่อยู่ที่เลือก กรุณาลองใหม่อีกครั้ง' });
  }
  
  // สร้างข้อความที่อยู่ที่สมบูรณ์
  const fullAddress = [
    selectedAddress.address,
    selectedAddress.subdistrict,
    selectedAddress.district,
    selectedAddress.province,
    selectedAddress.postalCode
  ].filter(Boolean).join(' ');
  
  // ใช้ที่อยู่ที่เลือก
  return handleAddress(psid, fullAddress, (session.tempData as any)?.name);
}

// ฟังก์ชันสำหรับแจ้งให้ผู้ใช้กรอกที่อยู่ใหม่
export async function promptNewAddress(psid: string) {
  callSendAPIAsync(psid, { text: 'กรุณากรอกที่อยู่ใหม่ของคุณ' });
  await updateSession(psid, { step: 'await_new_address' });
}

export async function askPayment(psid: string) {
  callSendAPIAsync(psid, {
    text: 'เลือกวิธีชำระเงินค่ะ',
    quick_replies: [
      { content_type: 'text', title: '💳 โอนเงิน', payload: 'PAY_TRANSFER' },
      { content_type: 'text', title: '💵 เก็บเงินปลายทาง (COD)', payload: 'PAY_COD' },
    ],
  });
  await updateSession(psid, { step: 'await_payment_method' });
}

export async function sendBankInfo(psid: string) {
  // ส่งข้อความแบบมีการจัดรูปแบบที่ดีขึ้น
  callSendAPIAsync(psid, {
    text: '📢 ข้อมูลการชำระเงิน\n\n🏦 ธนาคารกสิกรไทย\n📝 เลขที่บัญชี: 1943234902\n👤 ชื่อบัญชี: บริษัท วินริช ไดนามิค จำกัด\n\n💡 เมื่อโอนเงินเรียบร้อยแล้ว กรุณาส่งสลิปการโอนเงินเป็นรูปภาพในแชทนี้',
  });
  
  // ส่งข้อความพร้อมตัวเลือก
  callSendAPIAsync(psid, { 
    text: 'โอนเสร็จแล้ว โปรดอัปโหลดสลิปเป็นรูปภาพในแชทนี้ค่ะ',
    quick_replies: [
      { content_type:'text', title:'เปลี่ยนวิธีชำระเงิน', payload:'CHANGE_PAYMENT' }
    ]
  });
  
  await updateSession(psid, { 
    step: 'await_slip',
    tempData: {
      ...(await getSession(psid)).tempData,
      paymentMethod: 'transfer'
    } 
  });
}

// ยืนยัน COD ก่อนสร้างออเดอร์ เพื่อให้ผู้ใช้เปลี่ยนใจได้
export async function confirmCOD(psid:string){
  const session = await getSession(psid);
  const total = session.cart.reduce((s,i)=>s+i.price*i.quantity,0);
  const shippingFee = await computeShippingFee(session.cart);
  const grand = total + shippingFee;
  
  // สรุปรายการสั่งซื้อแบบละเอียด
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
  
  // ส่งข้อความสรุปคำสั่งซื้อแบบละเอียด
  callSendAPIAsync(psid, {
    text: `📋 สรุปคำสั่งซื้อ (เก็บเงินปลายทาง)\n\n${itemsText}\n\n💰 ราคาสินค้า: ${total.toLocaleString()} บาท\n🚚 ค่าจัดส่ง: ${shippingFee.toLocaleString()} บาท\n📊 รวมทั้งหมด: ${grand.toLocaleString()} บาท\n\nโปรดยืนยันการสั่งซื้อ`,
    quick_replies:[
      { content_type:'text', title:'ยืนยัน ✔️', payload:'COD_CONFIRM' },
      { content_type:'text', title:'เปลี่ยนวิธีชำระเงิน', payload:'CHANGE_PAYMENT' }
    ]
  });
  
  await updateSession(psid, { 
    step:'await_cod_confirm',
    tempData: {
      ...(session.tempData || {}),
      paymentMethod: 'cod'
    } 
  });
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