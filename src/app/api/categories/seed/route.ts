import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Category from '@/models/Category';

const defaultCategories = [
  { name: 'ทั่วไป', description: 'สินค้าทั่วไป', isActive: true, displayOrder: 0 },
  { name: 'กาวและซีลแลนท์', description: 'กาว ซีลแลนท์ และวัสดุยึดติด', isActive: true, displayOrder: 1 },
  { name: 'เครื่องมือ', description: 'เครื่องมือช่างและอุปกรณ์', isActive: true, displayOrder: 2 },
  { name: 'อะไหล่', description: 'อะไหล่และชิ้นส่วน', isActive: true, displayOrder: 3 },
  { name: 'วัสดุก่อสร้าง', description: 'วัสดุก่อสร้างและซ่อมแซม', isActive: true, displayOrder: 4 },
];

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    // ตรวจสอบว่ามี categories อยู่แล้วหรือไม่
    const existingCategories = await Category.find({});
    
    if (existingCategories.length === 0) {
      // สร้าง default categories
      const result = await Category.insertMany(defaultCategories);
      
      return NextResponse.json({
        success: true,
        message: `สร้าง ${result.length} หมวดหมู่เริ่มต้นเรียบร้อย`,
        categories: result
      });
    } else {
      // เพิ่มหมวดหมู่ที่ขาดหายไป
      const addedCategories = [];
      
      for (const defaultCat of defaultCategories) {
        const exists = existingCategories.find(cat => cat.name === defaultCat.name);
        if (!exists) {
          const newCat = await Category.create(defaultCat);
          addedCategories.push(newCat);
        }
      }
      
      if (addedCategories.length > 0) {
        return NextResponse.json({
          success: true,
          message: `เพิ่ม ${addedCategories.length} หมวดหมู่ที่ขาดหายไป`,
          categories: addedCategories
        });
      } else {
        return NextResponse.json({
          success: true,
          message: 'หมวดหมู่ครบถ้วนแล้ว',
          existingCount: existingCategories.length
        });
      }
    }
  } catch (error) {
    console.error('Error seeding categories:', error);
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการสร้างหมวดหมู่เริ่มต้น' },
      { status: 500 }
    );
  }
}