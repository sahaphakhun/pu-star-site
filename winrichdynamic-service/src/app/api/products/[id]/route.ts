import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Product from '@/models/Product';
import { verifyToken } from '@/lib/auth';

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();
    const resolvedParams = await params;
    const doc = await Product.findById(resolvedParams.id);
    if (!doc) return NextResponse.json({ error: 'ไม่พบสินค้า' }, { status: 404 });
    return NextResponse.json(doc);
  } catch (error) {
    console.error('[B2B] Error get product:', error);
    return NextResponse.json({ error: 'เกิดข้อผิดพลาดในการดึงสินค้า' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = verifyToken(request);
    if (!auth.valid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const resolvedParams = await params;
    const body = await request.json();
    const { 
      name, 
      price, 
      description, 
      imageUrl, 
      units, 
      category, 
      options, 
      skuConfig,
      skuVariants,
      isAvailable 
    } = body;

    if (!name || !description || !imageUrl) {
      return NextResponse.json({ error: 'กรุณากรอกข้อมูลให้ครบถ้วน' }, { status: 400 });
    }

    // ตรวจสอบว่ามี SKU variants หรือไม่
    if (skuVariants && skuVariants.length > 0) {
      // ตรวจสอบว่า SKU ซ้ำหรือไม่ (ยกเว้นสินค้าปัจจุบัน)
      const existingSkus = await Product.find({
        _id: { $ne: resolvedParams.id },
        'skuVariants.sku': { $in: skuVariants.map((v: any) => v.sku) }
      });
      
      if (existingSkus.length > 0) {
        return NextResponse.json(
          { error: 'มี SKU ที่ซ้ำกันในระบบ กรุณาใช้ SKU อื่น' },
          { status: 400 }
        );
      }
    }

    const product = await Product.findByIdAndUpdate(
      resolvedParams.id,
      {
        name,
        price: parseFloat(price) || 0,
        description,
        imageUrl,
        units: units || [],
        category: category || 'ทั่วไป',
        options: options || [],
        skuConfig: skuConfig || null,
        skuVariants: skuVariants || [],
        isAvailable: isAvailable !== false,
      },
      { new: true }
    );

    if (!product) {
      return NextResponse.json({ error: 'ไม่พบสินค้า' }, { status: 404 });
    }

    return NextResponse.json({ 
      success: true, 
      data: product,
      message: 'อัปเดตสินค้าเรียบร้อยแล้ว'
    });
  } catch (error) {
    console.error('[B2B] Error updating product:', error);
    return NextResponse.json({ error: 'เกิดข้อผิดพลาดในการอัปเดตสินค้า' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = verifyToken(request);
    if (!auth.valid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const resolvedParams = await params;
    const product = await Product.findByIdAndDelete(resolvedParams.id);

    if (!product) {
      return NextResponse.json({ error: 'ไม่พบสินค้า' }, { status: 404 });
    }

    return NextResponse.json({ 
      success: true, 
      message: 'ลบสินค้าเรียบร้อยแล้ว'
    });
  } catch (error) {
    console.error('[B2B] Error deleting product:', error);
    return NextResponse.json({ error: 'เกิดข้อผิดพลาดในการลบสินค้า' }, { status: 500 });
  }
}


