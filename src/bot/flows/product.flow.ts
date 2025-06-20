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
  // เริ่มต้นด้วยข้อความต้อนรับและให้ผู้ใช้เลือกหัวข้อหลัก 3 ข้อ
  sendTypingAndMessages(psid, {
    text: 'สวัสดีค่ะ ฉันคือ Next Star Bot 🤖\nกรุณาเลือกหัวข้อที่ต้องการค่ะ',
    quick_replies: [
      { content_type: 'text', title: 'สอบถามรายละเอียด', payload: 'Q_INQUIRY' },
      { content_type: 'text', title: 'สั่งซื้อ', payload: 'Q_ORDER' },
      { content_type: 'text', title: 'ติดต่อแอดมิน', payload: 'Q_CONTACT_ADMIN' },
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
        {
          type: 'postback',
          title: 'สั่งซื้อ 🛒',
          payload: `ORDER_${p._id}`,
        },
        {
          type: 'web_url',
          title: 'ดูรายละเอียด',
          url: `${(process.env.NEXT_PUBLIC_SITE_URL || 'https://pu-star-site-production.up.railway.app').replace(/\/$/, '')}/products/${p._id}`,
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

// จัดการ postback ORDER_<id>
export async function handleOrderPostback(psid: string, payload: string) {
  const productId = payload.replace('ORDER_', '');
  const product = await getProductById(productId);
  if (!product) {
    callSendAPIAsync(psid, { text: 'ไม่พบสินค้านี้แล้วครับ' });
    return;
  }
  const idStr = (product._id as any).toString();

  // ถ้ามีหน่วย ให้ถามหน่วยก่อน
  if (product.units && product.units.length > 0) {
    await updateSession(psid, {
      step: 'select_unit',
      tempData: {
        product: {
          id: idStr,
          name: product.name,
          price: product.price, // default
          options: product.options ?? [],
          units: product.units,
        },
      },
    });
    return askUnit(psid);
  }

  // ถ้าสินค้ามีตัวเลือก ให้ถามตัวเลือกต่อ
  if (product.options && product.options.length > 0) {
    // เก็บข้อมูลสินค้าไว้ใน session ชั่วคราว
    await updateSession(psid, {
      step: 'select_option',
      tempData: {
        product: {
          id: idStr,
          name: product.name,
          price: product.price,
          options: product.options,
        },
        selections: {},
        optIdx: 0,
      },
    });
    return askNextOption(psid);
  }

  // ไม่มีตัวเลือก จึงเพิ่มตรง ๆ
  await addToCart(psid, {
    productId: idStr,
    name: product.name,
    price: product.price || (product.units && product.units[0]?.price) || 0,
    quantity: 1,
    selectedOptions: {},
    unitLabel: product.units && product.units[0]?.label,
    unitPrice: product.units && product.units[0]?.price,
  });

  const session = await getSession(psid);
  const total = session.cart.reduce((sum, i) => sum + i.price * i.quantity, 0);
  
  let unitText = '';
  if (product.units && product.units[0]?.label) {
    unitText = ` (${product.units[0].label})`;
  }
  
  callSendAPIAsync(psid, {
    text: `เพิ่ม ${product.name}${unitText} ในตะกร้าแล้ว 🎉\nยอดรวม ${total.toLocaleString()} บาท`,
    quick_replies: [
      { content_type: 'text', title: 'ยืนยันการสั่งซื้อ', payload: 'CONFIRM_CART' },
      { content_type: 'text', title: 'ดูตะกร้า', payload: 'SHOW_CART' },
      { content_type: 'text', title: 'ดูสินค้าเพิ่ม', payload: 'SHOW_PRODUCTS' },
    ],
  });

  await updateSession(psid, { step: 'summary' });
}

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
      let fee: string;
      if (typeof u.shippingFee === 'number') {
        fee = u.shippingFee === 0 ? 'ส่งฟรี' : `ค่าส่ง ${u.shippingFee}`;
      } else {
        fee = 'ค่าส่ง';
      }
      const titleRaw = `${u.label} (${u.price.toLocaleString()}฿ / ${fee})`;
      return {
        content_type: 'text',
        title: titleRaw.substring(0, 20),
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
