import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import Category from '@/models/Category';
import Product from '@/models/Product';
import { auth } from '@/lib/auth';
import { PERMISSIONS } from '@/constants/permissions';

// GET: ดึงรายการหมวดหมู่ทั้งหมดสำหรับแอดมิน (รวม inactive)
export async function GET(request: NextRequest) {
  try {
    // ตรวจสอบสิทธิ์
    const session = await auth(request);
    if (!session?.user) {
      return NextResponse.json({ error: 'ไม่ได้รับอนุญาต' }, { status: 401 });
    }

    if (!session.user.isAdmin && !session.user.permissions?.includes(PERMISSIONS.PRODUCTS_VIEW)) {
      return NextResponse.json({ error: 'ไม่มีสิทธิ์ในการดูหมวดหมู่' }, { status: 403 });
    }

    await connectToDatabase();
    
    // ดึงหมวดหมู่ทั้งหมด และนับจำนวนสินค้าในแต่ละหมวดหมู่
    const categories = await Category.find({})
      .sort({ displayOrder: 1, name: 1 })
      .lean();

    // นับจำนวนสินค้าในแต่ละหมวดหมู่
    const categoriesWithCount = await Promise.all(
      categories.map(async (category) => {
        const productCount = await Product.countDocuments({ 
          category: category.name 
        });
        return {
          ...category,
          productCount
        };
      })
    );
    
    return NextResponse.json(categoriesWithCount);
  } catch (error) {
    console.error('Error fetching admin categories:', error);
    return NextResponse.json(
      { error: 'ไม่สามารถดึงข้อมูลหมวดหมู่ได้' },
      { status: 500 }
    );
  }
}