import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Product from '@/models/Product';
import { clearCache } from '@cache/simpleCache';
import { productInputSchema } from '@schemas/product';

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
  const rawBody = await request.json();

  // แปลงค่าที่อาจเป็น string → number ก่อน validation
  if (rawBody.price === '') {
    delete rawBody.price;
  } else if (rawBody.price !== undefined) {
    rawBody.price = Number(rawBody.price);
  }

  if (rawBody.shippingFee !== undefined && rawBody.shippingFee !== '') {
    rawBody.shippingFee = Number(rawBody.shippingFee);
  }

  if (Array.isArray(rawBody.units)) {
    rawBody.units = rawBody.units
      .filter((u: any) => u.label && u.price !== '')
      .map((u: any) => {
        const mapped: any = { ...u, price: Number(u.price) };
        if (u.shippingFee !== undefined && u.shippingFee !== '') {
          mapped.shippingFee = Number(u.shippingFee);
        }
        return mapped;
      });
  }

  const parsed = productInputSchema.safeParse(rawBody);
  if (!parsed.success) {
    return NextResponse.json({ error: 'รูปแบบข้อมูลไม่ถูกต้อง', details: parsed.error.errors }, { status: 400 });
  }

  const { name, price, description, imageUrl, options, category, units, shippingFee, isAvailable, wmsConfig, wmsVariantConfigs } = parsed.data;

  if (price === undefined && (!units || units.length === 0)) {
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
      shippingFee,
      isAvailable: isAvailable !== undefined ? isAvailable : true,
      wmsConfig,
      wmsVariantConfigs,
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