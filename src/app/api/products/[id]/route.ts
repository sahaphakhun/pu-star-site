import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Product from '@/models/Product';

interface RouteParams {
  params: {
    id: string;
  };
}

// ดึงข้อมูลสินค้าตาม ID
export async function GET(_: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params;
    await connectDB();
    const product = await Product.findById(id);

    if (!product) {
      return NextResponse.json(
        { error: 'ไม่พบสินค้า' },
        { status: 404 }
      );
    }

    return NextResponse.json(product);
  } catch (error) {
    console.error('Error fetching product:', error);
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการดึงข้อมูลสินค้า' },
      { status: 500 }
    );
  }
}

// อัพเดทสินค้าตาม ID
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params;
    const body = await request.json();
    const { name, price, description, imageUrl } = body;

    // ตรวจสอบข้อมูลที่จำเป็น
    if (!name || !price || !description || !imageUrl) {
      return NextResponse.json(
        { error: 'กรุณากรอกข้อมูลให้ครบถ้วน' },
        { status: 400 }
      );
    }

    await connectDB();
    
    const updatedProduct = await Product.findByIdAndUpdate(
      id,
      {
        name,
        price,
        description,
        imageUrl
      },
      { new: true, runValidators: true }
    );

    if (!updatedProduct) {
      return NextResponse.json(
        { error: 'ไม่พบสินค้า' },
        { status: 404 }
      );
    }

    return NextResponse.json(updatedProduct);
  } catch (error) {
    console.error('Error updating product:', error);
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการอัพเดทสินค้า' },
      { status: 500 }
    );
  }
}

// ลบสินค้าตาม ID
export async function DELETE(_: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params;
    await connectDB();
    const deletedProduct = await Product.findByIdAndDelete(id);

    if (!deletedProduct) {
      return NextResponse.json(
        { error: 'ไม่พบสินค้า' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { message: 'ลบสินค้าสำเร็จ' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting product:', error);
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการลบสินค้า' },
      { status: 500 }
    );
  }
} 