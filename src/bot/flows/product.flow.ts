import { callSendAPIAsync } from '@/utils/messenger';
import Product, { IProduct } from '@/models/Product';
import { addToCart, updateSession, getSession } from '../state';
import connectDB from '@/lib/mongodb';
import { getCache, setCache } from '@cache/simpleCache';
import { sendTypingOn } from '@/utils/messenger';
import { transformImage } from '@utils/image';

function slug(text: string): string {
  return encodeURIComponent(
    text
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9\-]/g, '')
  );
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
  await sendTypingOn(psid);
  callSendAPIAsync(psid, {
    text: 'สวัสดีค่ะ! ฉันคือ Next Star Bot 🤖\nเลือกสินค้า สั่งซื้อ และติดตามสถานะได้ง่าย ๆ ผ่านแชทนี้\nเริ่มต้นด้วยการเลือกหมวดหมู่สินค้าด้านล่างเลยค่ะ',
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
          title: 'ดูสินค้า',
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

  updateSession(psid, { step: 'browse_category' });
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

  const elements = filtered.slice(0, 10).map((p: IProduct) => ({
    title: p.name,
    subtitle: `${p.price.toLocaleString()} บาท`,
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
        url: `${(process.env.NEXT_PUBLIC_SITE_URL || 'https://www.nextstarinnovations.com').replace(/\/$/, '')}/product/${p._id}`,
        webview_height_ratio: 'tall',
      },
      {
        type: 'postback',
        title: 'ติดต่อแอดมิน',
        payload: 'CONTACT_ADMIN',
      },
    ],
  }));

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

  updateSession(psid, { step: 'browse_product' });
}

// จัดการ postback CATEGORY_<slug>
export async function handleCategoryPostback(psid: string, payload: string) {
  const slug = payload.replace('CATEGORY_', '');
  return showProducts(psid, slug);
}

// จัดการ postback ORDER_<id>
export async function handleOrderPostback(psid: string, payload: string) {
  const productId = payload.replace('ORDER_', '');
  await connectDB();
  const product = await Product.findById(productId).lean<IProduct | null>();
  if (!product) {
    callSendAPIAsync(psid, { text: 'ไม่พบสินค้านี้แล้วครับ' });
    return;
  }
  const idStr = (product._id as any).toString();

  addToCart(psid, {
    productId: idStr,
    name: product.name,
    price: product.price,
    quantity: 1,
  });

  const session = getSession(psid);
  const total = session.cart.reduce((sum, i) => sum + i.price * i.quantity, 0);

  callSendAPIAsync(psid, {
    text: `เพิ่ม ${product.name} ในตะกร้าแล้ว 🎉\nยอดรวมชั่วคราว: ${total.toLocaleString()} บาท`,
    quick_replies: [
      { content_type: 'text', title: 'ยืนยันการสั่งซื้อ', payload: 'CONFIRM_CART' },
      { content_type: 'text', title: 'ดูสินค้าเพิ่ม', payload: 'SHOW_PRODUCTS' },
    ],
  });

  updateSession(psid, { step: 'summary' });
}
