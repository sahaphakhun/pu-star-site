import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import SKUConfig from '@/models/SKUConfig';

// GET - ดึงข้อมูล SKU Config ทั้งหมด
export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const isActive = searchParams.get('isActive');
    
    let query: any = {};
    
    if (category) {
      query.category = category;
    }
    
    if (isActive !== null) {
      query.isActive = isActive === 'true';
    }
    
    const skuConfigs = await SKUConfig.find(query)
      .sort({ createdAt: -1 })
      .lean();
    
    return NextResponse.json(skuConfigs);
  } catch (error) {
    console.error('[SKU Configs API] GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - สร้าง SKU Config ใหม่
export async function POST(request: NextRequest) {
  try {
    await connectDB();
    
    const body = await request.json();
    const { name, prefix, format, category, description } = body;
    
    // ตรวจสอบข้อมูลที่จำเป็น
    if (!name || !prefix || !format) {
      return NextResponse.json(
        { error: 'กรุณากรอกข้อมูลให้ครบถ้วน' },
        { status: 400 }
      );
    }
    
    // ตรวจสอบว่า prefix ซ้ำหรือไม่
    const existingPrefix = await SKUConfig.findOne({ prefix: prefix.toUpperCase() });
    if (existingPrefix) {
      return NextResponse.json(
        { error: 'คำนำหน้า SKU นี้มีอยู่ในระบบแล้ว' },
        { status: 400 }
      );
    }
    
    // สร้าง SKU Config ใหม่
    const skuConfig = new SKUConfig({
      name,
      prefix: prefix.toUpperCase(),
      format,
      counter: 1,
      category,
      description,
      isActive: true,
    });
    
    await skuConfig.save();
    
    return NextResponse.json(skuConfig, { status: 201 });
  } catch (error) {
    console.error('[SKU Configs API] POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
