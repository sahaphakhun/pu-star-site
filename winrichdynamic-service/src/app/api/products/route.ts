import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Product from '@/models/Product';

// GET /api/products - ดึงรายการสินค้าทั้งหมด
export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const status = searchParams.get('status');
    const search = searchParams.get('search');
    
    // สร้าง query filter
    const filter: any = {};
    
    if (category) {
      filter.category = category;
    }
    
    if (status && status !== 'all') {
      filter.status = status;
    }
    
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { sku: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }
    
    const products = await Product.find(filter)
      .sort({ createdAt: -1 })
      .limit(100);
    
    return NextResponse.json({
      success: true,
      data: products
    });
    
  } catch (error) {
    console.error('[B2B] Error fetching products:', error);
    return NextResponse.json(
      { success: false, error: 'เกิดข้อผิดพลาดในการดึงข้อมูลสินค้า' },
      { status: 500 }
    );
  }
}

// POST /api/products - สร้างสินค้าใหม่
export async function POST(request: NextRequest) {
  try {
    await connectDB();
    
    const body = await request.json();
    const { name, description, price, cost, sku, category, stock, unit, status, specifications } = body;
    
    // ตรวจสอบข้อมูลที่จำเป็น
    if (!name || !sku || price === undefined || stock === undefined) {
      return NextResponse.json(
        { success: false, error: 'กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วน' },
        { status: 400 }
      );
    }
    
    // ตรวจสอบว่า SKU ซ้ำหรือไม่
    const existingProduct = await Product.findOne({ sku });
    if (existingProduct) {
      return NextResponse.json(
        { success: false, error: 'SKU นี้มีอยู่ในระบบแล้ว กรุณาใช้ SKU อื่น' },
        { status: 400 }
      );
    }
    
    // สร้างสินค้าใหม่
    const product = new Product({
      name,
      description: description || '',
      price: parseFloat(price) || 0,
      cost: parseFloat(cost) || 0,
      sku,
      category: category || '',
      stock: parseInt(stock) || 0,
      unit: unit || 'ชิ้น',
      status: status || 'active',
      specifications: specifications || {}
    });
    
    await product.save();
    
    console.log(`[B2B] Product created: ${product.name} (${product.sku})`);
    
    return NextResponse.json({
      success: true,
      message: 'สร้างสินค้าเรียบร้อยแล้ว',
      data: product
    });
    
  } catch (error) {
    console.error('[B2B] Error creating product:', error);
    return NextResponse.json(
      { success: false, error: 'เกิดข้อผิดพลาดในการสร้างสินค้า' },
      { status: 500 }
    );
  }
}


