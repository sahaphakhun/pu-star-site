import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Product from '@/models/Product';
import { createProductSchema, productSearchSchema } from '@/schemas/product';
import { verifyToken } from '@/lib/auth';

// GET /api/products - ดึงรายการสินค้า
export async function GET(request: NextRequest) {
  try {
    console.log('[B2B] GET /api/products - Starting to fetch products');
    
    await connectDB();
    console.log('[B2B] Database connected successfully');

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const rawSearch = searchParams.get('search') || '';
    const rawCategory = searchParams.get('category') || '';
    const rawIsAvailable = searchParams.get('isAvailable');
    const rawPage = parseInt(searchParams.get('page') || '1');
    const rawLimit = parseInt(searchParams.get('limit') || '20');

    console.log('[B2B] Query parameters:', {
      search: rawSearch,
      category: rawCategory,
      isAvailable: rawIsAvailable,
      page: rawPage,
      limit: rawLimit
    });

    // Validate query parameters
    const queryValidation = productSearchSchema.safeParse({
      search: rawSearch,
      category: rawCategory || undefined,
      isAvailable: rawIsAvailable ? rawIsAvailable === 'true' : undefined,
      page: rawPage,
      limit: rawLimit
    });

    if (!queryValidation.success) {
      console.log('[B2B] Query validation failed:', queryValidation.error.issues);
      return NextResponse.json(
        { success: false, error: 'Invalid query parameters' },
        { status: 400 }
      );
    }

    const { search, category, isAvailable, page, limit } = queryValidation.data;

    // Build filter
    const filter: any = {};

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { 'skuConfig.prefix': { $regex: search, $options: 'i' } }
      ];
    }

    if (category) {
      filter.category = category;
    }

    if (typeof isAvailable === 'boolean') {
      filter.isAvailable = isAvailable;
    }

    console.log('[B2B] MongoDB filter:', JSON.stringify(filter, null, 2));

    // Calculate pagination
    const skip = (page - 1) * limit;

    console.log('[B2B] Executing MongoDB query...');

    // Execute query
    const [products, total] = await Promise.all([
      Product.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Product.countDocuments(filter)
    ]);

    console.log('[B2B] MongoDB query completed');
    console.log('[B2B] Products found:', products.length);
    console.log('[B2B] Total products:', total);
    console.log('[B2B] Sample product:', products[0]);

    return NextResponse.json({
      success: true,
      data: products,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('[B2B] Error fetching products:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/products - สร้างสินค้าใหม่
export async function POST(request: NextRequest) {
  try {
    console.log('[B2B] POST /api/products - Starting product creation');
    
    // Verify authentication
    const auth = verifyToken(request);
    console.log('[B2B] Auth result:', auth);
    
    if (!auth.valid) {
      console.log('[B2B] Authentication failed:', auth.error);
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();

    const body = await request.json();
    console.log('[B2B] Request body:', body);

    // Validate request body
    const validation = createProductSchema.safeParse(body);
    if (!validation.success) {
      console.log('[B2B] Validation failed:', validation.error.issues);
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid data',
          details: validation.error.issues 
        },
        { status: 400 }
      );
    }

    const productData = validation.data;
    console.log('[B2B] Validated product data:', productData);

    // Check if product with same name already exists
    const existingProduct = await Product.findOne({ name: productData.name });
    if (existingProduct) {
      console.log('[B2B] Product with same name exists:', existingProduct.name);
      return NextResponse.json(
        { success: false, error: 'สินค้าชื่อนี้มีอยู่แล้ว' },
        { status: 400 }
      );
    }

    // Create new product
    const product = new Product(productData);
    console.log('[B2B] Product model instance created:', product);
    
    await product.save();
    console.log('[B2B] Product saved successfully with ID:', product._id);

    return NextResponse.json({
      success: true,
      data: product,
      message: 'สร้างสินค้าสำเร็จ'
    }, { status: 201 });

  } catch (error) {
    console.error('[B2B] Error creating product:', error);
    
    // Handle specific MongoDB errors
    if (error instanceof Error) {
      if (error.message.includes('validation failed')) {
        return NextResponse.json(
          { success: false, error: 'ข้อมูลไม่ถูกต้อง กรุณาตรวจสอบข้อมูลที่กรอก' },
          { status: 400 }
        );
      }
      
      if (error.message.includes('duplicate key')) {
        return NextResponse.json(
          { success: false, error: 'สินค้าชื่อนี้มีอยู่ในระบบแล้ว' },
          { status: 400 }
        );
      }
    }
    
    return NextResponse.json(
      { success: false, error: 'เกิดข้อผิดพลาดในการสร้างสินค้า กรุณาลองใหม่อีกครั้ง' },
      { status: 500 }
    );
  }
}


