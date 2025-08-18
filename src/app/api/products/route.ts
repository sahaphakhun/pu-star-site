import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Product from '@/models/Product';
import { verifyToken } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const authResult = await verifyToken(request);
    if (!authResult || !authResult.valid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const body = await request.json();
    
    const { name, price, description, imageUrl, units, category, options, wmsConfig, wmsVariantConfigs, skuConfig, skuVariants, isAvailable } = body;

    // Validation
    if (!name || !description || !imageUrl) {
      return NextResponse.json({ error: 'กรุณากรอกข้อมูลให้ครบถ้วน' }, { status: 400 });
    }

    if (price === undefined && (!units || units.length === 0)) {
      return NextResponse.json({ error: 'กรุณาระบุราคาเดี่ยว หรือ เพิ่มหน่วยอย่างน้อย 1 หน่วย' }, { status: 400 });
    }

    // Create product data
    const productData: any = {
      name,
      description,
      imageUrl,
      category: category || 'ทั่วไป',
      isAvailable: isAvailable !== false,
    };

    if (price !== undefined) {
      productData.price = price;
    }

    if (units && units.length > 0) {
      productData.units = units;
    }

    if (options && options.length > 0) {
      productData.options = options;
    }

    // Add WMS configuration if provided
    if (wmsConfig) {
      productData.wmsConfig = wmsConfig;
    }

    if (wmsVariantConfigs && wmsVariantConfigs.length > 0) {
      productData.wmsVariantConfigs = wmsVariantConfigs;
    }

    // Add SKU configuration if provided
    if (skuConfig) {
      productData.skuConfig = skuConfig;
    }

    if (skuVariants && skuVariants.length > 0) {
      productData.skuVariants = skuVariants;
    }

    const product = new Product(productData);
    await product.save();

    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    console.error('Error creating product:', error);
    return NextResponse.json({ error: 'เกิดข้อผิดพลาดในการสร้างสินค้า' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const authResult = await verifyToken(request);
    if (!authResult || !authResult.valid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const search = searchParams.get('search');
    
    let query: any = {};
    
    if (category && category !== 'all') {
      query.category = category;
    }
    
    if (search) {
      query.$text = { $search: search };
    }
    
    const products = await Product.find(query).sort({ createdAt: -1 });
    
    return NextResponse.json(products);
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json({ error: 'เกิดข้อผิดพลาดในการดึงข้อมูลสินค้า' }, { status: 500 });
  }
} 