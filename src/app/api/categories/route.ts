import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Category from '@/models/Category';
import { categoryInputSchema } from '@/schemas/category';
import { verifyToken } from '@/lib/auth';
import { PERMISSIONS } from '@/constants/permissions';

// GET: ดึงรายการหมวดหมู่ทั้งหมด
export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    // ดึงเฉพาะหมวดหมู่ที่ active เรียงตาม displayOrder และ name
    const categories = await Category.find({ isActive: true })
      .sort({ displayOrder: 1, name: 1 })
      .select('name description displayOrder')
      .lean();
    
    // ถ้าไม่มีหมวดหมู่ ส่งข้อมูลเริ่มต้น
    if (!categories || categories.length === 0) {
      const defaultCategories = [
        { _id: '1', name: 'ทั่วไป', description: 'สินค้าทั่วไป', displayOrder: 0 },
        { _id: '2', name: 'กาวและซีลแลนท์', description: 'กาว ซีลแลนท์ และวัสดุยึดติด', displayOrder: 1 },
        { _id: '3', name: 'เครื่องมือ', description: 'เครื่องมือช่างและอุปกรณ์', displayOrder: 2 },
        { _id: '4', name: 'อะไหล่', description: 'อะไหล่และชิ้นส่วน', displayOrder: 3 },
        { _id: '5', name: 'วัสดุก่อสร้าง', description: 'วัสดุก่อสร้างและซ่อมแซม', displayOrder: 4 },
      ];
      
      console.log('No categories found, returning defaults');
      return NextResponse.json(defaultCategories);
    }
    
    // ตรวจสอบว่า categories เป็น array
    const result = Array.isArray(categories) ? categories : [];
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching categories:', error);
    
    // ส่งข้อมูลเริ่มต้นในกรณี error แทนการส่ง 500
    const defaultCategories = [
      { _id: '1', name: 'ทั่วไป', description: 'สินค้าทั่วไป', displayOrder: 0 },
      { _id: '2', name: 'กาวและซีลแลนท์', description: 'กาว ซีลแลนท์ และวัสดุยึดติด', displayOrder: 1 },
      { _id: '3', name: 'เครื่องมือ', description: 'เครื่องมือช่างและอุปกรณ์', displayOrder: 2 },
      { _id: '4', name: 'อะไหล่', description: 'อะไหล่และชิ้นส่วน', displayOrder: 3 },
      { _id: '5', name: 'วัสดุก่อสร้าง', description: 'วัสดุก่อสร้างและซ่อมแซม', displayOrder: 4 },
    ];
    
    return NextResponse.json(defaultCategories);
  }
}

// POST: สร้างหมวดหมู่ใหม่
export async function POST(request: NextRequest) {
  try {
    // ตรวจสอบสิทธิ์
    const authResult = await verifyToken(request);
    if (!authResult?.valid) {
      return NextResponse.json({ error: 'ไม่ได้รับอนุญาต' }, { status: 401 });
    }

    // ตรวจสอบสิทธิ์การจัดการหมวดหมู่ (เฉพาะ admin เท่านั้น)
    if (authResult.decoded?.role !== 'admin') {
      return NextResponse.json({ error: 'ไม่มีสิทธิ์ในการสร้างหมวดหมู่' }, { status: 403 });
    }

    const body = await request.json();
    const validatedData = categoryInputSchema.parse(body);

    await connectDB();

    // ตรวจสอบว่าชื่อหมวดหมู่ซ้ำหรือไม่
    const existingCategory = await Category.findOne({ name: validatedData.name });
    if (existingCategory) {
      return NextResponse.json(
        { error: 'มีหมวดหมู่นี้อยู่แล้ว' },
        { status: 400 }
      );
    }

    const category = await Category.create(validatedData);
    return NextResponse.json(category.toObject ? category.toObject() : category, { status: 201 });
  } catch (error) {
    console.error('Error creating category:', error);
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'ข้อมูลไม่ถูกต้อง', details: error.message },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'ไม่สามารถสร้างหมวดหมู่ได้' },
      { status: 500 }
    );
  }
}