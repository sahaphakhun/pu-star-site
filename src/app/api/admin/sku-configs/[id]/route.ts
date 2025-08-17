import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import SKUConfig from '@/models/SKUConfig';

// GET - ดึงข้อมูล SKU Config ตาม ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();
    
    const skuConfig = await SKUConfig.findById(params.id).lean();
    
    if (!skuConfig) {
      return NextResponse.json(
        { error: 'ไม่พบ SKU Config' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(skuConfig);
  } catch (error) {
    console.error('[SKU Config API] GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT - อัปเดต SKU Config
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();
    
    const body = await request.json();
    const { name, prefix, format, category, description, isActive, counter } = body;
    
    // ตรวจสอบข้อมูลที่จำเป็น
    if (!name || !prefix || !format) {
      return NextResponse.json(
        { error: 'กรุณากรอกข้อมูลให้ครบถ้วน' },
        { status: 400 }
      );
    }
    
    // ตรวจสอบว่า prefix ซ้ำหรือไม่ (ยกเว้นตัวเอง)
    const existingPrefix = await SKUConfig.findOne({
      prefix: prefix.toUpperCase(),
      _id: { $ne: params.id }
    });
    
    if (existingPrefix) {
      return NextResponse.json(
        { error: 'คำนำหน้า SKU นี้มีอยู่ในระบบแล้ว' },
        { status: 400 }
      );
    }
    
    // อัปเดต SKU Config
    const updatedSKUConfig = await SKUConfig.findByIdAndUpdate(
      params.id,
      {
        name,
        prefix: prefix.toUpperCase(),
        format,
        category,
        description,
        isActive,
        counter: Math.max(1, counter || 1),
      },
      { new: true, runValidators: true }
    );
    
    if (!updatedSKUConfig) {
      return NextResponse.json(
        { error: 'ไม่พบ SKU Config' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(updatedSKUConfig);
  } catch (error) {
    console.error('[SKU Config API] PUT error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE - ลบ SKU Config
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();
    
    const deletedSKUConfig = await SKUConfig.findByIdAndDelete(params.id);
    
    if (!deletedSKUConfig) {
      return NextResponse.json(
        { error: 'ไม่พบ SKU Config' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ message: 'ลบ SKU Config สำเร็จ' });
  } catch (error) {
    console.error('[SKU Config API] DELETE error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
