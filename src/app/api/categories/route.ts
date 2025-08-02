import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import Category from '@/models/Category';
import { categoryInputSchema } from '@/schemas/category';
import { auth } from '@/lib/auth';
import { PERMISSIONS } from '@/constants/permissions';

// GET: ดึงรายการหมวดหมู่ทั้งหมด
export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();
    
    // ดึงเฉพาะหมวดหมู่ที่ active เรียงตาม displayOrder และ name
    const categories = await Category.find({ isActive: true })
      .sort({ displayOrder: 1, name: 1 })
      .select('name description displayOrder')
      .lean();
    
    return NextResponse.json(categories);
  } catch (error) {
    console.error('Error fetching categories:', error);
    return NextResponse.json(
      { error: 'ไม่สามารถดึงข้อมูลหมวดหมู่ได้' },
      { status: 500 }
    );
  }
}

// POST: สร้างหมวดหมู่ใหม่
export async function POST(request: NextRequest) {
  try {
    // ตรวจสอบสิทธิ์
    const session = await auth(request);
    if (!session?.user) {
      return NextResponse.json({ error: 'ไม่ได้รับอนุญาต' }, { status: 401 });
    }

    // ตรวจสอบสิทธิ์การจัดการหมวดหมู่ (ใช้สิทธิ์เดียวกับการจัดการสินค้า)
    if (!session.user.isAdmin && !session.user.permissions?.includes(PERMISSIONS.PRODUCTS_CREATE)) {
      return NextResponse.json({ error: 'ไม่มีสิทธิ์ในการสร้างหมวดหมู่' }, { status: 403 });
    }

    const body = await request.json();
    const validatedData = categoryInputSchema.parse(body);

    await connectToDatabase();

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