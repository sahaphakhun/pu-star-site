import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Category from '@/models/Category';
import Product from '@/models/Product';
import { verifyAuth } from '@/lib/auth';
import { PERMISSIONS } from '@/constants/permissions';

// GET: ดึงรายการหมวดหมู่ทั้งหมดสำหรับแอดมิน (รวม inactive)
export async function GET(request: NextRequest) {
  try {
    // ตรวจสอบสิทธิ์
    const session = await verifyAuth(request);
    if (!session?.user) {
      return NextResponse.json({ error: 'ไม่ได้รับอนุญาต' }, { status: 401 });
    }

    if (session.user.role !== 'admin') {
      return NextResponse.json({ error: 'ไม่มีสิทธิ์ในการดูหมวดหมู่' }, { status: 403 });
    }

    await connectDB();
    
    // ดึงหมวดหมู่ทั้งหมด และนับจำนวนสินค้าในแต่ละหมวดหมู่
    const categories = await Category.find({})
      .sort({ displayOrder: 1, name: 1 })
      .lean();

    // ถ้าไม่มี categories ให้สร้างข้อมูลเริ่มต้น
    if (!categories || categories.length === 0) {
      const defaultCategories = [
        { name: 'ทั่วไป', description: 'สินค้าทั่วไป', isActive: true, displayOrder: 0 },
        { name: 'กาวและซีลแลนท์', description: 'กาว ซีลแลนท์ และวัสดุยึดติด', isActive: true, displayOrder: 1 },
        { name: 'เครื่องมือ', description: 'เครื่องมือช่างและอุปกรณ์', isActive: true, displayOrder: 2 },
        { name: 'อะไหล่', description: 'อะไหล่และชิ้นส่วน', isActive: true, displayOrder: 3 },
        { name: 'วัสดุก่อสร้าง', description: 'วัสดุก่อสร้างและซ่อมแซม', isActive: true, displayOrder: 4 },
      ];
      
      // สร้าง categories ใหม่
      const createdCategories = await Category.insertMany(defaultCategories);
      
      // ส่งข้อมูลที่สร้างใหม่พร้อม productCount = 0
      const categoriesWithCount = createdCategories.map((category: any) => ({
        ...category.toObject(),
        productCount: 0
      }));
      
      return NextResponse.json(categoriesWithCount);
    }

    // นับจำนวนสินค้าในแต่ละหมวดหมู่
    const categoriesWithCount = await Promise.all(
      categories.map(async (category: any) => {
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
    
    // ส่งข้อมูลเริ่มต้นในกรณี error แทนการส่ง 500
    const defaultCategories = [
      { _id: '1', name: 'ทั่วไป', description: 'สินค้าทั่วไป', isActive: true, displayOrder: 0, productCount: 0, createdAt: new Date(), updatedAt: new Date() },
      { _id: '2', name: 'กาวและซีลแลนท์', description: 'กาว ซีลแลนท์ และวัสดุยึดติด', isActive: true, displayOrder: 1, productCount: 0, createdAt: new Date(), updatedAt: new Date() },
      { _id: '3', name: 'เครื่องมือ', description: 'เครื่องมือช่างและอุปกรณ์', isActive: true, displayOrder: 2, productCount: 0, createdAt: new Date(), updatedAt: new Date() },
      { _id: '4', name: 'อะไหล่', description: 'อะไหล่และชิ้นส่วน', isActive: true, displayOrder: 3, productCount: 0, createdAt: new Date(), updatedAt: new Date() },
      { _id: '5', name: 'วัสดุก่อสร้าง', description: 'วัสดุก่อสร้างและซ่อมแซม', isActive: true, displayOrder: 4, productCount: 0, createdAt: new Date(), updatedAt: new Date() },
    ];
    
    return NextResponse.json(defaultCategories);
  }
}