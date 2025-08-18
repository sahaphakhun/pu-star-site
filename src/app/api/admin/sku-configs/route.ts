import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import SKU from '@/models/SKU';
import Product from '@/models/Product';

// GET: ดึงข้อมูล SKU ทั้งหมด
export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('productId');
    const isActive = searchParams.get('isActive');
    
    let query: any = {};
    
    if (productId) {
      query.productId = productId;
    }
    
    if (isActive !== null) {
      query.isActive = isActive === 'true';
    }
    
    const skus = await SKU.find(query)
      .populate('productId', 'name imageUrl')
      .sort({ createdAt: -1 });
    
    return NextResponse.json({ success: true, data: skus });
  } catch (error) {
    console.error('Error fetching SKUs:', error);
    return NextResponse.json(
      { success: false, error: 'เกิดข้อผิดพลาดในการดึงข้อมูล SKU' },
      { status: 500 }
    );
  }
}

// POST: สร้าง SKU ใหม่
export async function POST(request: NextRequest) {
  try {
    await connectDB();
    
    const body = await request.json();
    const { productId, skuPrefix, unitLabel, options, price, shippingFee, stockQuantity, minStockLevel, maxStockLevel } = body;
    
    // ตรวจสอบว่าสินค้าอยู่จริง
    const product = await Product.findById(productId);
    if (!product) {
      return NextResponse.json(
        { success: false, error: 'ไม่พบสินค้าที่ระบุ' },
        { status: 404 }
      );
    }
    
    // สร้าง SKU ใหม่
    const sku = new SKU({
      productId,
      skuPrefix,
      unitLabel,
      options,
      price,
      shippingFee,
      stockQuantity,
      minStockLevel,
      maxStockLevel,
    });
    
    await sku.save();
    
    // ดึงข้อมูลที่อัปเดตแล้ว
    const savedSku = await SKU.findById(sku._id).populate('productId', 'name imageUrl');
    
    return NextResponse.json({ 
      success: true, 
      data: savedSku,
      message: 'สร้าง SKU สำเร็จ' 
    });
  } catch (error: any) {
    console.error('Error creating SKU:', error);
    
    if (error.code === 11000) {
      return NextResponse.json(
        { success: false, error: 'SKU Code ซ้ำกัน กรุณาลองใหม่อีกครั้ง' },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { success: false, error: 'เกิดข้อผิดพลาดในการสร้าง SKU' },
      { status: 500 }
    );
  }
}
