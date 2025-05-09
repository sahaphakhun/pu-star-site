import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Product from '@/models/Product';

// GET: ดึงสินค้าทั้งหมด
export async function GET() {
  await connectDB();
  const products = await Product.find().sort({ createdAt: -1 });
  return NextResponse.json(products);
}

// POST: สร้างสินค้าใหม่
export async function POST(request: NextRequest) {
  const { name, price, description, imageUrl } = await request.json();
  if (!name || !price || !description || !imageUrl) {
    return NextResponse.json({ error: 'กรุณากรอกข้อมูลให้ครบถ้วน' }, { status: 400 });
  }
  await connectDB();
  const product = await Product.create({ name, price, description, imageUrl });
  return NextResponse.json(product, { status: 201 });
} 