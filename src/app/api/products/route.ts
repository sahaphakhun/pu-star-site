import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Product from '@/models/Product';

export async function GET() {
  try {
    await connectDB();
    const products = await Product.find().sort({ createdAt: -1 });
    return NextResponse.json(products);
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการดึงข้อมูลสินค้า' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, price, description, imageUrl } = body;

    // ตรวจสอบข้อมูลที่จำเป็น
    if (!name || !price || !description || !imageUrl) {
      return NextResponse.json(
        { error: 'กรุณากรอกข้อมูลให้ครบถ้วน' },
        { status: 400 }
      );
    }

    await connectDB();
    
    const product = await Product.create({
      name,
      price,
      description,
      imageUrl
    });

    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    console.error('Error creating product:', error);
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการสร้างสินค้า' },
      { status: 500 }
    );
  }
} 