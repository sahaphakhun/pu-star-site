import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Product from '@/models/Product';

// GET: ดึงข้อมูลสินค้าเฉพาะ id
export async function GET(request: NextRequest, context: unknown) {
  const { id } = (context as { params: { id: string } }).params;
  await connectDB();
  const product = await Product.findById(id);
  if (!product) {
    return NextResponse.json({ error: 'ไม่พบสินค้า' }, { status: 404 });
  }
  return NextResponse.json(product);
}

// PUT: อัปเดตสินค้า
export async function PUT(request: NextRequest, context: unknown) {
  const { id } = (context as { params: { id: string } }).params;
  const { name, price, description, imageUrl } = await request.json();
  if (!name || !price || !description || !imageUrl) {
    return NextResponse.json({ error: 'กรุณากรอกข้อมูลให้ครบถ้วน' }, { status: 400 });
  }
  await connectDB();
  const updated = await Product.findByIdAndUpdate(
    id,
    { name, price, description, imageUrl },
    { new: true, runValidators: true }
  );
  if (!updated) {
    return NextResponse.json({ error: 'ไม่พบสินค้า' }, { status: 404 });
  }
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
  return NextResponse.json({ message: 'ลบสินค้าสำเร็จ' });
} 