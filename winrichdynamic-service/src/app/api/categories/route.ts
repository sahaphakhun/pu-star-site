import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Category from '@/models/Category';

// GET /api/categories - ดึงรายการหมวดหมู่ทั้งหมด
export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    const categories = await Category.find({ isActive: true })
      .sort({ name: 1 });
    
    return NextResponse.json({
      success: true,
      data: categories
    });
    
  } catch (error) {
    console.error('[B2B] Error fetching categories:', error);
    return NextResponse.json(
      { success: false, error: 'เกิดข้อผิดพลาดในการดึงข้อมูลหมวดหมู่' },
      { status: 500 }
    );
  }
}

// POST /api/categories - สร้างหมวดหมู่ใหม่
export async function POST(request: NextRequest) {
  try {
    await connectDB();
    
    const body = await request.json();
    const { name, description } = body;
    
    // ตรวจสอบข้อมูลที่จำเป็น
    if (!name) {
      return NextResponse.json(
        { success: false, error: 'กรุณาระบุชื่อหมวดหมู่' },
        { status: 400 }
      );
    }
    
    // ตรวจสอบว่าชื่อหมวดหมู่ซ้ำหรือไม่
    const existingCategory = await Category.findOne({ name: { $regex: new RegExp(`^${name}$`, 'i') } });
    if (existingCategory) {
      return NextResponse.json(
        { success: false, error: 'ชื่อหมวดหมู่นี้มีอยู่ในระบบแล้ว' },
        { status: 400 }
      );
    }
    
    // สร้างหมวดหมู่ใหม่
    const category = new Category({
      name: name.trim(),
      description: description?.trim() || '',
      isActive: true
    });
    
    await category.save();
    
    console.log(`[B2B] Category created: ${category.name}`);
    
    return NextResponse.json({
      success: true,
      message: 'สร้างหมวดหมู่เรียบร้อยแล้ว',
      data: category
    });
    
  } catch (error) {
    console.error('[B2B] Error creating category:', error);
    return NextResponse.json(
      { success: false, error: 'เกิดข้อผิดพลาดในการสร้างหมวดหมู่' },
      { status: 500 }
    );
  }
}


