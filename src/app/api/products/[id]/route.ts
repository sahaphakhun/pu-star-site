import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Product from '@/models/Product';
import { clearCache } from '@cache/simpleCache';

// GET: ดึงข้อมูลสินค้าเฉพาะ id
export async function GET(request: NextRequest, context: unknown) {
  const { id } = (context as { params: { id: string } }).params;
  await connectDB();
  const product = await Product.findById(id).lean();
  if (!product) {
    return NextResponse.json({ error: 'ไม่พบสินค้า' }, { status: 404 });
  }
  return NextResponse.json(product);
}

// PUT: อัปเดตสินค้า
export async function PUT(request: NextRequest, context: unknown) {
  const { id } = (context as { params: { id: string } }).params;
  const body = await request.json();
  const {
    name,
    price: rawPrice,
    description,
    imageUrl,
    options,
    category,
    units: rawUnits,
  } = body;

  // แปลง price จาก string → number และกรองค่าว่าง
  const price = rawPrice === '' || rawPrice === undefined || rawPrice === null ? undefined : Number(rawPrice);

  // แปลง units ภายใน ให้ price เป็น number
  const units = Array.isArray(rawUnits)
    ? rawUnits.map((u: any) => ({ ...u, price: Number(u.price) }))
    : undefined;

  if (!name || !description || !imageUrl) {
    return NextResponse.json({ error: 'กรุณากรอกข้อมูลให้ครบถ้วน' }, { status: 400 });
  }

  if ((!price && (!units || units.length === 0))) {
    return NextResponse.json({ error: 'กรุณาระบุราคา หรือ เพิ่มหน่วยอย่างน้อย 1 หน่วย' }, { status: 400 });
  }

  await connectDB();
  const updated = await Product.findByIdAndUpdate(
    id,
    {
      name,
      price: price ?? (units && units.length > 0 ? units[0].price : undefined),
      description,
      imageUrl,
      options,
      category,
      units,
    },
    { new: true, runValidators: true }
  );
  if (!updated) {
    return NextResponse.json({ error: 'ไม่พบสินค้า' }, { status: 404 });
  }
  clearCache('products');
  return NextResponse.json(updated);
}

// DELETE: ลบสินค้า
export async function DELETE(request: NextRequest, context: unknown) {
  const { id } = (context as { params: { id: string } }).params;
  await connectDB();
  const deleted = await Product.findByIdAndDelete(id);
  if (!deleted) {
    return NextResponse.json({ error: 'ไม่พบสินค้า' }, { status: 404 });
  }
  clearCache('products');
  return NextResponse.json({ message: 'ลบสินค้าสำเร็จ' });
} 