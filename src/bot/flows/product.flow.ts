import { callSendAPI } from '@/utils/messenger';
import Product, { IProduct } from '@/models/Product';
import { addToCart, updateSession, getSession } from '../state';
import connectDB from '@/lib/mongodb';
import { getCache, setCache } from '@cache/simpleCache';
import { sendTypingOn } from '@/utils/messenger';
import { transformImage } from '@utils/image';

// ส่งรายการสินค้าล่าสุดในรูปแบบ carousel
export async function showProducts(psid: string) {
  // แจ้งกำลังพิมพ์ให้ผู้ใช้เห็นเร็วขึ้น
  await sendTypingOn(psid);

  let products = getCache<IProduct[]>('products');
  if (!products) {
    await connectDB();
    products = (await Product.find().sort({ createdAt: -1 }).limit(10).lean()) as unknown as IProduct[];
    setCache('products', products, 60_000); // cache 60s
  }

  console.log('[ProductFlow] products length', products.length);

  if (products.length === 0) {
    await callSendAPI(psid, { text: 'ขออภัย ขณะนี้ยังไม่มีสินค้าที่จะแสดง' });
    return;
  }

  const elements = products.map((p: IProduct) => ({
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

  await callSendAPI(psid, {
    attachment: {
      type: 'template',
      payload: {
        template_type: 'generic',
        image_aspect_ratio: 'square',
        elements,
      },
    },
  });

  updateSession(psid, { step: 'browse' });
}

// จัดการ postback ORDER_<id>
export async function handleOrderPostback(psid: string, payload: string) {
  const productId = payload.replace('ORDER_', '');
  await connectDB();
  const product = await Product.findById(productId).lean<IProduct | null>();
  if (!product) {
    await callSendAPI(psid, { text: 'ไม่พบสินค้านี้แล้วครับ' });
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

  await callSendAPI(psid, {
    text: `เพิ่ม ${product.name} ในตะกร้าแล้ว 🎉\nยอดรวมชั่วคราว: ${total.toLocaleString()} บาท`,
    quick_replies: [
      { content_type: 'text', title: 'ยืนยันการสั่งซื้อ', payload: 'CONFIRM_CART' },
      { content_type: 'text', title: 'ดูสินค้าเพิ่ม', payload: 'SHOW_PRODUCTS' },
    ],
  });

  updateSession(psid, { step: 'summary' });
} 