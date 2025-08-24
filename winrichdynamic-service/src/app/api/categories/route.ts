import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Category from '@/models/Category';

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const categories = await Category.find({ isActive: true }).sort({ name: 1 });
    
    return NextResponse.json({ 
      success: true, 
      data: categories,
      message: 'ดึงข้อมูลหมวดหมู่เรียบร้อยแล้ว'
    });
  } catch (error) {
    console.error('[B2B] Error fetching categories:', error);
    return NextResponse.json({ 
      success: false,
      error: 'เกิดข้อผิดพลาดในการดึงข้อมูลหมวดหมู่' 
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const body = await request.json();
    const { name, slug } = body;

    if (!name) {
      return NextResponse.json({ error: 'กรุณาระบุชื่อหมวดหมู่' }, { status: 400 });
    }

    const doc = await Category.create({ name, slug });
    return NextResponse.json(doc, { status: 201 });
  } catch (error: any) {
    if (error?.code === 11000) {
      return NextResponse.json({ error: 'ชื่อหมวดหมู่ซ้ำ' }, { status: 409 });
    }
    console.error('[B2B] Error creating category:', error);
    return NextResponse.json({ error: 'เกิดข้อผิดพลาดในการสร้างหมวดหมู่' }, { status: 500 });
  }
}


