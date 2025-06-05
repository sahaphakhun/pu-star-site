import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Product from '@/models/Product';
import { clearCache } from '@cache/simpleCache';

// GET: ดึงสินค้าทั้งหมด
export async function GET() {
  await connectDB();
  const products = await Product.find().sort({ createdAt: -1 }).lean();
  return NextResponse.json(products);
}

// POST: สร้างสินค้าใหม่
export async function POST(request: NextRequest) {
  const { name, price, description, imageUrl, options, category, units } = await request.json();

  if (!name || !description || !imageUrl) {
    return NextResponse.json({ error: 'กรุณากรอกข้อมูลให้ครบถ้วน' }, { status: 400 });
  }

  // ต้องมีอย่างน้อย price หรือ units
  if ((!price && (!units || units.length === 0))) {
    return NextResponse.json({ error: 'กรุณาระบุราคา หรือ เพิ่มหน่วยอย่างน้อย 1 หน่วย' }, { status: 400 });
  }

  await connectDB();

  // หากไม่ได้ส่ง price มา แต่มี units ให้ตั้ง price เริ่มต้น = ราคาหน่วยแรก
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
  return NextResponse.json(product, { status: 201 });
} 