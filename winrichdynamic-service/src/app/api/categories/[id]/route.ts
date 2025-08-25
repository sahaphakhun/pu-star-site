import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Category from '@/models/Category';
import { updateCategorySchema } from '@/schemas/category';

// GET /api/categories/[id] - ดึงข้อมูลหมวดหมู่เฉพาะ
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    
    const { id } = await params;
    const category = await Category.findById(id);
    
    if (!category) {
      return NextResponse.json(
        { success: false, error: 'ไม่พบหมวดหมู่นี้' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      data: category
    });
    
  } catch (error) {
    console.error('[B2B] Error fetching category:', error);
    return NextResponse.json(
      { success: false, error: 'เกิดข้อผิดพลาดในการดึงข้อมูลหมวดหมู่' },
      { status: 500 }
    );
  }
}

// PUT /api/categories/[id] - อัปเดตหมวดหมู่
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    
    const { id } = await params;
    const body = await request.json();
    
    // Validate input data
    const validationResult = updateCategorySchema.safeParse(body);
    if (!validationResult.success) {
      const errors = validationResult.error.errors.map((err: any) => err.message);
      return NextResponse.json(
        { 
          success: false, 
          error: 'ข้อมูลไม่ถูกต้อง',
          details: errors 
        },
        { status: 400 }
      );
    }
    
    const { name, description, isActive } = validationResult.data;
    
    // ตรวจสอบว่าหมวดหมู่มีอยู่หรือไม่
    const existingCategory = await Category.findById(id);
    if (!existingCategory) {
      return NextResponse.json(
        { success: false, error: 'ไม่พบหมวดหมู่นี้' },
        { status: 404 }
      );
    }
    
    // ตรวจสอบว่าชื่อหมวดหมู่ซ้ำหรือไม่ (ถ้ามีการเปลี่ยนชื่อ)
    if (name && name !== existingCategory.name) {
      const duplicateCategory = await Category.findOne({ 
        name: { $regex: new RegExp(`^${name}$`, 'i') },
        _id: { $ne: id }
      });
      
      if (duplicateCategory) {
        return NextResponse.json(
          { success: false, error: 'ชื่อหมวดหมู่นี้มีอยู่ในระบบแล้ว' },
          { status: 400 }
        );
      }
    }
    
    // อัปเดตข้อมูล
    const updateData: any = {};
    if (name !== undefined) updateData.name = name.trim();
    if (description !== undefined) updateData.description = description?.trim() || '';
    if (isActive !== undefined) updateData.isActive = isActive;
    
    const updatedCategory = await Category.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );
    
    console.log(`[B2B] Category updated: ${updatedCategory.name} (ID: ${updatedCategory._id})`);
    
    return NextResponse.json({
      success: true,
      message: 'อัปเดตหมวดหมู่เรียบร้อยแล้ว',
      data: updatedCategory
    });
    
  } catch (error: any) {
    console.error('[B2B] Error updating category:', error);
    
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
      { success: false, error: 'เกิดข้อผิดพลาดในการอัปเดตหมวดหมู่' },
      { status: 500 }
    );
  }
}

// DELETE /api/categories/[id] - ลบหมวดหมู่ (soft delete)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    
    const { id } = await params;
    
    // ตรวจสอบว่าหมวดหมู่มีอยู่หรือไม่
    const existingCategory = await Category.findById(id);
    if (!existingCategory) {
      return NextResponse.json(
        { success: false, error: 'ไม่พบหมวดหมู่นี้' },
        { status: 404 }
      );
    }
    
    // Soft delete โดยการตั้งค่า isActive เป็น false
    const deletedCategory = await Category.findByIdAndUpdate(
      id,
      { isActive: false },
      { new: true }
    );
    
    console.log(`[B2B] Category soft deleted: ${deletedCategory.name} (ID: ${deletedCategory._id})`);
    
    return NextResponse.json({
      success: true,
      message: 'ลบหมวดหมู่เรียบร้อยแล้ว',
      data: deletedCategory
    });
    
  } catch (error) {
    console.error('[B2B] Error deleting category:', error);
    return NextResponse.json(
      { success: false, error: 'เกิดข้อผิดพลาดในการลบหมวดหมู่' },
      { status: 500 }
    );
  }
}
