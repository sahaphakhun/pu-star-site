import { getCache, setCache } from '@/cache/simpleCache';
import connectDB from '@/lib/mongodb';
import Product, { IProduct } from '@/models/Product';

// ดึงสินค้าตามไอดี โดย cache ไว้ชั่วคราวเพื่อลด DB hit
export async function getProductById(id: string): Promise<IProduct | null> {
  // ใช้คีย์ cache ตามไอดีสินค้า
  const cacheKey = `product:${id}`;
  let product = getCache<IProduct>(cacheKey);
  if (product) return product;

  // ไม่พบใน cache → query DB แล้วเก็บผลไว้ 1 ชั่วโมง
  await connectDB();
  product = await Product.findById(id).lean<IProduct | null>();
  if (product) {
    setCache(cacheKey, product, 3_600_000); // 1 ชั่วโมง
  }
  return product;
} 