import { callSendAPIAsync } from '@/utils/messenger';
import Product, { IProduct } from '@/models/Product';
import { addToCart, updateSession, getSession } from '../state';
import { getProductById } from '@/utils/productCache';
import { getCache, setCache } from '@cache/simpleCache';
import { sendTypingAndMessages, sendTypingOn } from '@/utils/messenger';
import { transformImage } from '@utils/image';
import connectDB from '@/lib/mongodb';
import { computeShippingFee } from '@/utils/shipping';

function slug(text: string): string {
  // แปลงเป็น lower-case + trim แล้ว encodeURIComponent เพื่อให้รองรับอักขระไทย/พิเศษ
  return encodeURIComponent(text.toLowerCase().trim().replace(/\s+/g, '-'));
}

// ดึงสินค้าทั้งหมดจาก cache/DB
async function getAllProducts(): Promise<IProduct[]> {
  let products = getCache<IProduct[]>('products');
  if (!products) {
    await connectDB();
    products = (await Product.find().sort({ createdAt: -1 }).lean()) as unknown as IProduct[];
    setCache('products', products, 86_400_000); // cache 1 วัน
  }
  return products;
}

// ส่งข้อความแนะนำตัวครั้งแรก
export async function sendWelcome(psid: string) {
  // เริ่มต้นด้วยข้อความต้อนรับและให้ผู้ใช้เลือกหัวข้อหลัก 4 ข้อ
  sendTypingAndMessages(psid, {
    text: 'สวัสดีค่ะ กรุณาเลือกหัวข้อที่ต้องการค่ะ \nกรณีต้องการสั่งซื้อ กรุณาทำการสั่งซื้อผ่านเว็บไซต์\nhttps://www.winrichdynamic.com',
    quick_replies: [
      { content_type: 'text', title: 'สอบถามรายละเอียด', payload: 'Q_INQUIRY' },
      { content_type: 'text', title: 'สั่งซื้อ', payload: 'Q_ORDER_WEBSITE' },
      { content_type: 'text', title: 'ติดต่อแอดมิน', payload: 'Q_CONTACT_ADMIN' },
      { content_type: 'text', title: 'รับการแจ้งเตือน', payload: 'Q_NOTIFICATION' },
    ],
  });
}

// แสดงหมวดหมู่สินค้าแบบ carousel
export async function showCategories(psid: string) {
  const products = await getAllProducts();
  const map = new Map<string, IProduct>();
  for (const p of products) {
    const cat = p.category || 'ทั่วไป';
    if (!map.has(cat)) map.set(cat, p); // เก็บสินค้าแรกในหมวดเพื่อรูป
  }
  const categories = Array.from(map.keys());

  if (categories.length === 0) {
    return callSendAPIAsync(psid, { text: 'ยังไม่มีหมวดหมู่สินค้าให้เลือกค่ะ' });
  }

  const elements = categories.map((cat) => {
    const sampleProduct = map.get(cat)!;
    return {
      title: cat,
      subtitle: 'ดูสินค้าภายในหมวดนี้',
      image_url: transformImage(sampleProduct.imageUrl),
      buttons: [
        {
          type: 'postback',
          title: `ดูสินค้า ${cat.length > 13 ? cat.slice(0, 13) + '…' : cat}`,
          payload: `CATEGORY_${slug(cat)}`,
        },
      ],
    };
  });

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

  await updateSession(psid, { step: 'browse_category' });
}

// ส่งรายการสินค้าล่าสุดในรูปแบบ carousel (เลือกตามหมวด)
export async function showProducts(psid: string, categorySlug?: string) {
  // แจ้งกำลังพิมพ์ให้ผู้ใช้เห็นเร็วขึ้น
  await sendTypingOn(psid);

  const products = await getAllProducts();

  let filtered = products;
  if (categorySlug) {
    const decoded = decodeURIComponent(categorySlug);
    filtered = products.filter((p) => slug(p.category || 'ทั่วไป') === slug(decoded));
  }

  if (filtered.length === 0) {
    callSendAPIAsync(psid, { text: 'ขออภัย ยังไม่มีสินค้าภายในหมวดนี้ค่ะ' });
    return;
  }

  const elements = filtered.slice(0, 10).map((p: IProduct) => {
    let subtitle = `${(p.price || (p.units && p.units[0]?.price) || 0).toLocaleString()} บาท`;
    
    // เพิ่มข้อมูลหน่วยถ้ามี
    if (p.units && p.units.length > 0) {
      if (p.units.length === 1) {
        subtitle += ` / ${p.units[0].label}`;
      } else {
        subtitle += ` (${p.units.length} หน่วย)`;
      }
    }
    
    return {
      title: p.name,
      subtitle,
      image_url: transformImage(p.imageUrl),
      buttons: [
        // ลบปุ่มสั่งซื้อ 🛒 ออก เหลือแค่ดูรายละเอียดและติดต่อแอดมิน
        {
          type: 'web_url',
          title: 'ดูรายละเอียด',
                          url: `${(process.env.NEXT_PUBLIC_SITE_URL || 'https://www.winrichdynamic.com').replace(/\/$/, '')}/products/${(p as any)._id}`,
          webview_height_ratio: 'tall',
        },
        {
          type: 'postback',
          title: 'ติดต่อแอดมิน',
          payload: 'CONTACT_ADMIN',
        },
      ],
    };
  });

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

  await updateSession(psid, { step: 'browse_product' });
}

// จัดการ postback CATEGORY_<slug>
export async function handleCategoryPostback(psid: string, payload: string) {
  const slug = payload.replace('CATEGORY_', '');
  return showProducts(psid, slug);
}

// ลบฟังก์ชัน handleOrderPostback และการเรียกใช้งานที่เกี่ยวข้องกับ ORDER_ ออก (หรือคอมเมนต์ไว้ถ้าจำเป็น)

// ถามตัวเลือกตามลำดับ
export async function askNextOption(psid: string): Promise<void> {
  const sess = await getSession(psid);
  const temp: any = sess.tempData;
  const product = temp.product;
  const idx: number = temp.optIdx || 0;
  const option = product.options[idx];
  if (!option) return; // safety

  await sendTypingOn(psid);
  return callSendAPIAsync(psid, {
    text: `เลือก ${option.name}`,
    quick_replies: option.values.slice(0, 11).map((v: any) => ({
      content_type: 'text',
      title: v.label.substring(0, 20),
      payload: `OPT_${idx}_${encodeURIComponent(v.label)}`,
    })),
  });
}

// ถามจำนวน
export async function askQuantity(psid: string): Promise<void> {
  const sess = await getSession(psid);
  const unitLabel = (sess.tempData as any)?.selectedUnit?.label || '';

  await sendTypingOn(psid);
  await updateSession(psid, { step: 'ask_quantity' });

  const prompt = unitLabel
    ? `ต้องการกี่${unitLabel}คะ? พิมพ์ตัวเลขจำนวนที่ต้องการ เช่น 3`
    : 'ต้องการกี่ชิ้นคะ? พิมพ์ตัวเลขจำนวนที่ต้องการ เช่น 3';

  return callSendAPIAsync(psid, {
    text: prompt,
    quick_replies: [1, 2, 3, 4, 5].map((n) => ({
      content_type: 'text',
      title: `${n}`,
      payload: `QTY_${n}`,
    })),
  });
}

// ถามหน่วย
export async function askUnit(psid: string): Promise<void> {
  const sess = await getSession(psid);
  const temp: any = sess.tempData;
  const product = temp.product;
  if (!product || !product.units) return;

  await sendTypingOn(psid);

  // ตรวจสอบว่ามีหน่วยใดที่มีค่าส่งหรือไม่ เพื่อแสดงบรรทัด "ค่าส่ง+... สินค้าปลีก"
  const unitWithShipping = product.units.find((u: any) => typeof u.shippingFee === 'number' && u.shippingFee > 0);
  const shippingLine = unitWithShipping ? `ค่าส่ง+${unitWithShipping.shippingFee ?? 50} สำหรับสินค้าปลีก` : '';

  return callSendAPIAsync(psid, {
    text: `เลือกหน่วยที่ต้องการสำหรับ ${product.name}${shippingLine ? '\n' + shippingLine : ''}`,
    quick_replies: product.units.slice(0, 11).map((u: any, idx: number) => {
      // สร้างข้อความ title ให้สั้นกว่า 20 ตัวอักษรเพื่อไม่ให้ Messenger ตัดทอนกลางข้อความ
      const priceStr = u.price.toLocaleString();
      let title: string;
      if (typeof u.shippingFee === 'number') {
        if (u.shippingFee === 0) {
          // ส่งฟรี
          title = `${u.label} ${priceStr}฿/ฟรี`;
        } else {
          title = `${u.label} ${priceStr}฿/+${u.shippingFee}`;
        }
      } else {
        title = `${u.label} ${priceStr}฿`;
      }
      // หากเกิน 20 ตัวอักษร ให้ตัด label ลงจนกว่าจะพอดี แต่อย่าให้ข้อมูลค่าส่งขาด
      if (title.length > 20) {
        // คงส่วนหลัง (หลังช่องว่างแรก) เอาไว้ แล้วตัดเฉพาะ label
        const parts = title.split(' ');
        const suffix = parts.slice(1).join(' '); // ส่วนที่เป็นราคา/ค่าส่ง
        let labelPart = parts[0];
        const maxLabelLen = 20 - suffix.length - 1; // เว้นช่องว่าง
        if (maxLabelLen > 0) {
          labelPart = labelPart.substring(0, maxLabelLen);
        } else {
          // ถ้า suffix เองยาวเกิน ให้ตัดจากท้าย (fallback ป้องกัน error)
          title = title.substring(0, 20);
          return {
            content_type: 'text',
            title,
            payload: `UNIT_${idx}`,
          };
        }
        title = `${labelPart} ${suffix}`;
      }
      return {
        content_type: 'text',
        title,
        payload: `UNIT_${idx}`,
      };
    }),
  });

  await updateSession(psid, { step: 'select_unit' });
}

// จัดการ postback UNIT_<idx>
export async function handleUnitPostback(psid: string, payload: string) {
  const idxStr = payload.replace('UNIT_', '');
  const idx = parseInt(idxStr, 10);
  if (isNaN(idx)) return;

  const sess = await getSession(psid);
  const temp: any = sess.tempData || {};
  const product = temp.product;
  if (!product || !product.units || !product.units[idx]) return;

  const selectedUnit = product.units[idx];

  await updateSession(psid, {
    tempData: { ...temp, selectedUnit },
  });

  // ถ้ามีตัวเลือก ให้ถามตัวเลือกต่อ
  if (product.options && product.options.length > 0) {
    await updateSession(psid, { step: 'select_option', tempData: { ...temp, selectedUnit, selections: {}, optIdx: 0 } });
    return askNextOption(psid);
  }

  // ไม่มีก็ถามจำนวนเลย
  return askQuantity(psid);
}

// เพิ่มสินค้าพร้อมตัวเลือกและจำนวนลงตะกร้า
export async function addProductWithOptions(psid: string, quantity: number) {
  const sess = await getSession(psid);
  const temp: any = sess.tempData;
  const product = temp.product;
  const selections = temp.selections || {};
  const selectedUnit = temp.selectedUnit as { label?: string; price?: number } | undefined;

  await addToCart(psid, {
    productId: product.id,
    name: product.name,
    price: selectedUnit?.price ?? product.price,
    quantity,
    selectedOptions: selections,
    unitLabel: selectedUnit?.label,
    unitPrice: selectedUnit?.price,
  });

  const updated = await getSession(psid);
  const total = updated.cart.reduce((sum, i) => sum + i.price * i.quantity, 0);
  
  // คำนวณค่าส่งคร่าว ๆ
  const shippingFee = await computeShippingFee(updated.cart);
  const grand = total + shippingFee;
  
  let unitText = '';
  if (selectedUnit?.label) {
    unitText = ` (${selectedUnit.label})`;
  }
  
  callSendAPIAsync(psid, {
    text: `เพิ่ม ${product.name}${unitText} จำนวน ${quantity} ในตะกร้าแล้ว 🎉\nยอดสินค้า ${total.toLocaleString()} บาท\nค่าส่ง ${shippingFee.toLocaleString()} บาท\nยอดรวม ${grand.toLocaleString()} บาท`,
    quick_replies: [
      { content_type: 'text', title: 'ยืนยันการสั่งซื้อ', payload: 'CONFIRM_CART' },
      { content_type: 'text', title: 'ดูตะกร้า', payload: 'SHOW_CART' },
      { content_type: 'text', title: 'ดูสินค้าเพิ่ม', payload: 'SHOW_PRODUCTS' },
    ],
  });

  await updateSession(psid, { step: 'summary', tempData: {} });
}

// Pre-warm product cache ระหว่าง cold-start
getAllProducts().catch(() => {});

// computeShippingFee นำเข้าจาก util แล้ว
