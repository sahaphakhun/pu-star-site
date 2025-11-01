import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Category from '@/models/Category';
import Product from '@/models/Product';
import { categoryUpdateSchema } from '@/schemas/category';
import { verifyToken } from '@/lib/auth';
import { PERMISSIONS } from '@/constants/permissions';

// GET: ดึงข้อมูลหมวดหมู่ตาม ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();
    
    const category = await Category.findById(params.id).lean();
    if (!category) {
      return NextResponse.json({ error: 'ไม่พบหมวดหมู่' }, { status: 404 });
    }
    
    return NextResponse.json(category);
  } catch (error) {
    console.error('Error fetching category:', error);
    return NextResponse.json(
      { error: 'ไม่สามารถดึงข้อมูลหมวดหมู่ได้' },
      { status: 500 }
    );
  }
}

// PUT: อัพเดทหมวดหมู่
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // ตรวจสอบสิทธิ์
    const authResult = await verifyToken(request);
    if (!authResult?.valid) {
      return NextResponse.json({ error: 'ไม่ได้รับอนุญาต' }, { status: 401 });
    }

    if (authResult.decoded?.role !== 'admin') {
      return NextResponse.json({ error: 'ไม่มีสิทธิ์ในการแก้ไขหมวดหมู่' }, { status: 403 });
    }

    const body = await request.json();
    const validatedData = categoryUpdateSchema.parse(body);

    await connectDB();

    // ตรวจสอบว่าหมวดหมู่มีอยู่จริง
    const existingCategory = await Category.findById(params.id);
    if (!existingCategory) {
      return NextResponse.json({ error: 'ไม่พบหมวดหมู่' }, { status: 404 });
    }

    // ถ้ามีการเปลี่ยนชื่อ ตรวจสอบว่าชื่อใหม่ซ้ำกับรายการอื่นหรือไม่
    if (validatedData.name && validatedData.name !== existingCategory.name) {
      const duplicateCategory = await Category.findOne({ 
        name: validatedData.name,
        _id: { $ne: params.id }
      });
      if (duplicateCategory) {
        return NextResponse.json(
          { error: 'มีหมวดหมู่นี้อยู่แล้ว' },
          { status: 400 }
        );
      }
    }

    const updatedCategory = await Category.findByIdAndUpdate(
      params.id,
      validatedData,
      { new: true, runValidators: true }
    );

    return NextResponse.json(updatedCategory?.toObject ? updatedCategory.toObject() : updatedCategory);
  } catch (error) {
    console.error('Error updating category:', error);
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'ข้อมูลไม่ถูกต้อง', details: error.message },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'ไม่สามารถอัพเดทหมวดหมู่ได้' },
      { status: 500 }
    );
  }
}

// DELETE: ลบหมวดหมู่
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // ตรวจสอบสิทธิ์
    const authResult = await verifyToken(request);
    if (!authResult?.valid) {
      return NextResponse.json({ error: 'ไม่ได้รับอนุญาต' }, { status: 401 });
    }

    if (authResult.decoded?.role !== 'admin') {
      return NextResponse.json({ error: 'ไม่มีสิทธิ์ในการลบหมวดหมู่' }, { status: 403 });
    }

    await connectDB();

    // ตรวจสอบว่าหมวดหมู่มีอยู่จริง
    const category = await Category.findById(params.id);
    if (!category) {
      return NextResponse.json({ error: 'ไม่พบหมวดหมู่' }, { status: 404 });
    }

    // ตรวจสอบว่ามีสินค้าในหมวดหมู่นี้หรือไม่
    const productsInCategory = await Product.countDocuments({ category: category.name });
    if (productsInCategory > 0) {
      return NextResponse.json(
        { 
          error: 'ไม่สามารถลบหมวดหมู่ได้ เนื่องจากยังมีสินค้าในหมวดหมู่นี้',
          productsCount: productsInCategory
        },
        { status: 400 }
      );
    }

    await Category.findByIdAndDelete(params.id);
    
    return NextResponse.json({ message: 'ลบหมวดหมู่สำเร็จ' });
  } catch (error) {
    console.error('Error deleting category:', error);
    return NextResponse.json(
      { error: 'ไม่สามารถลบหมวดหมู่ได้' },
      { status: 500 }
    );
  }
}