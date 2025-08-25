import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Category from '@/models/Category';
import { createCategorySchema } from '@/schemas/category';

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
    
    // Validate input data
    const validationResult = createCategorySchema.safeParse(body);
    if (!validationResult.success) {
      const errors = validationResult.error.format();
      const errorMessages = Object.values(errors).map((err: any) => err?._errors?.[0] || 'ข้อมูลไม่ถูกต้อง').filter(Boolean);
      
      return NextResponse.json(
        { 
          success: false, 
          error: 'ข้อมูลไม่ถูกต้อง',
          details: errorMessages 
        },
        { status: 400 }
      );
    }
    
    const { name, description } = validationResult.data;
    
    // ตรวจสอบว่าชื่อหมวดหมู่ซ้ำหรือไม่
    const existingCategory = await Category.findOne({ 
      name: { $regex: new RegExp(`^${name}$`, 'i') } 
    });
    
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
    
    console.log(`[B2B] Category created: ${category.name} (ID: ${category._id})`);
    
    return NextResponse.json({
      success: true,
      message: 'สร้างหมวดหมู่เรียบร้อยแล้ว',
      data: category
    });
    
  } catch (error: any) {
    console.error('[B2B] Error creating category:', error);
    
    // Handle specific MongoDB errors
    if (error.code === 11000) {
      return NextResponse.json(
        { success: false, error: 'ชื่อหมวดหมู่นี้มีอยู่ในระบบแล้ว' },
        { status: 400 }
      );
    }
    
    if (error.name === 'ValidationError') {
      const validationErrors = Object.keys(error.errors).map((key: string) => error.errors[key].message);
      return NextResponse.json(
        { 
          success: false, 
          error: 'ข้อมูลไม่ถูกต้อง',
          details: validationErrors 
        },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { success: false, error: 'เกิดข้อผิดพลาดในการสร้างหมวดหมู่' },
      { status: 500 }
    );
  }
}


