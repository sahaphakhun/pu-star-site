import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Product from '@/models/Product';
import { verifyToken } from '@/lib/auth';

// GET: ดึงข้อมูลสินค้าเฉพาะ id
export async function GET(request: NextRequest, context: unknown) {
  try {
    const { id } = (context as { params: { id: string } }).params;
    await connectDB();
    const product = await Product.findById(id).lean();
    if (!product) {
      return NextResponse.json({ error: 'ไม่พบสินค้า' }, { status: 404 });
    }
    return NextResponse.json(product);
  } catch (error) {
    console.error('Error fetching product:', error);
    return NextResponse.json({ error: 'เกิดข้อผิดพลาดในการดึงข้อมูลสินค้า' }, { status: 500 });
  }
}

// PUT: อัปเดตสินค้า
export async function PUT(request: NextRequest, context: unknown) {
  try {
    const authResult = await verifyToken(request);
    if (!authResult || !authResult.valid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = (context as { params: { id: string } }).params;
    const body = await request.json();
    
    const { name, price, description, imageUrl, units, category, options, wmsConfig, wmsVariantConfigs, skuConfig, skuVariants, isAvailable } = body;

    // Validation
    if (!name || !description || !imageUrl) {
      return NextResponse.json({ error: 'กรุณากรอกข้อมูลให้ครบถ้วน' }, { status: 400 });
    }

    if (price === undefined && (!units || units.length === 0)) {
      return NextResponse.json({ error: 'กรุณาระบุราคาเดี่ยว หรือ เพิ่มหน่วยอย่างน้อย 1 หน่วย' }, { status: 400 });
    }

    await connectDB();

    // Create update data
    const updateData: any = {
      name,
      description,
      imageUrl,
      category: category || 'ทั่วไป',
      isAvailable: isAvailable !== false,
    };

    if (price !== undefined) {
      updateData.price = price;
    }

    if (units && units.length > 0) {
      updateData.units = units;
    }

    if (options && options.length > 0) {
      updateData.options = options;
    }

    // Add WMS configuration if provided
    if (wmsConfig) {
      updateData.wmsConfig = wmsConfig;
    }

    if (wmsVariantConfigs && wmsVariantConfigs.length > 0) {
      updateData.wmsVariantConfigs = wmsVariantConfigs;
    }

    // Add SKU configuration if provided
    if (skuConfig) {
      updateData.skuConfig = skuConfig;
    }

    if (skuVariants && skuVariants.length > 0) {
      updateData.skuVariants = skuVariants;
    }

    const updated = await Product.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!updated) {
      return NextResponse.json({ error: 'ไม่พบสินค้า' }, { status: 404 });
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating product:', error);
    return NextResponse.json({ error: 'เกิดข้อผิดพลาดในการอัปเดตสินค้า' }, { status: 500 });
  }
}

// DELETE: ลบสินค้า
export async function DELETE(request: NextRequest, context: unknown) {
  try {
    const authResult = await verifyToken(request);
    if (!authResult || !authResult.valid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = (context as { params: { id: string } }).params;
    await connectDB();
    const deleted = await Product.findByIdAndDelete(id);
    if (!deleted) {
      return NextResponse.json({ error: 'ไม่พบสินค้า' }, { status: 404 });
    }
    return NextResponse.json({ message: 'ลบสินค้าสำเร็จ' });
  } catch (error) {
    console.error('Error deleting product:', error);
    return NextResponse.json({ error: 'เกิดข้อผิดพลาดในการลบสินค้า' }, { status: 500 });
  }
} 