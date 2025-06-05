import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Product from '@/models/Product';
import { clearCache } from '@cache/simpleCache';
import { productInputSchema } from '@schemas/product';

// GET: ดึงสินค้าทั้งหมด
export async function GET(request: NextRequest) {
  await connectDB();
  const searchParams = request.nextUrl.searchParams;
  const page = Number(searchParams.get('page') || '1');
  const limit = Math.min(Number(searchParams.get('limit') || '20'), 100);
  const q = searchParams.get('q') || '';
  const category = searchParams.get('category');

  const filter: Record<string, any> = {};
  if (q) {
    filter.name = { $regex: q, $options: 'i' };
  }
  if (category) {
    filter.category = category;
  }

  const total = await Product.countDocuments(filter);
  const products = await Product.find(filter)
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .lean();

  // ถ้าไม่ได้ส่ง query page/limit/q/category ให้คงรูปแบบ array เดิมเพื่อความเข้ากันได้
  const hasPaginationParam = searchParams.has('page') || searchParams.has('limit') || searchParams.has('q') || searchParams.has('category');
  if (!hasPaginationParam) {
    return NextResponse.json(products);
  }

  return NextResponse.json({ data: products, total, page, limit, totalPages: Math.ceil(total / limit) });
}

// POST: สร้างสินค้าใหม่
export async function POST(request: NextRequest) {
  const raw = await request.json();
  const parsed = productInputSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ error: 'รูปแบบข้อมูลไม่ถูกต้อง', details: parsed.error.errors }, { status: 400 });
  }
  const { name, price, description, imageUrl, options, category, units } = parsed.data;

  // ต้องมีอย่างน้อย price หรือ units
  if (price === undefined && (!units || units.length === 0)) {
    return NextResponse.json({ error: 'กรุณาระบุราคา หรือ เพิ่มหน่วยอย่างน้อย 1 หน่วย' }, { status: 400 });
  }

  await connectDB();

  const initialPrice = price ?? (units && units.length > 0 ? units[0].price : undefined);

  const product = await Product.create({
    name,
    price: initialPrice,
    description,
    imageUrl,
    options,
    category,
    units,
  });
  clearCache('products');
  return NextResponse.json(product.toObject ? product.toObject() : product, { status: 201 });
} 