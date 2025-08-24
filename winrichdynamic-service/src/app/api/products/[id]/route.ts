import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Product from '@/models/Product';
import { updateProductSchema } from '@/schemas/product';
import { verifyToken } from '@/lib/auth';

// GET /api/products/[id] - ดึงข้อมูลสินค้าเฉพาะรายการ
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();

    const resolvedParams = await params;
    const product = await Product.findById(resolvedParams.id).lean();
    
    if (!product) {
      return NextResponse.json(
        { success: false, error: 'ไม่พบสินค้า' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: product
    });

  } catch (error) {
    console.error('Error fetching product:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/products/[id] - อัพเดทข้อมูลสินค้า
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verify authentication
    const auth = verifyToken(request);
    if (!auth.valid) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();

    const body = await request.json();

    // Validate request body
    const validation = updateProductSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid data',
          details: validation.error.issues 
        },
        { status: 400 }
      );
    }

    const resolvedParams = await params;
    const updateData = validation.data;

    // Check if product exists
    const existingProduct = await Product.findById(resolvedParams.id);
    if (!existingProduct) {
      return NextResponse.json(
        { success: false, error: 'ไม่พบสินค้า' },
        { status: 404 }
      );
    }

    // Check if name is being changed and if it conflicts with another product
    if (updateData.name && updateData.name !== existingProduct.name) {
      const nameConflict = await Product.findOne({ 
        name: updateData.name,
        _id: { $ne: resolvedParams.id }
      });
      if (nameConflict) {
        return NextResponse.json(
          { success: false, error: 'สินค้าชื่อนี้มีอยู่แล้ว' },
          { status: 400 }
        );
      }
    }

    // Update product
    const updatedProduct = await Product.findByIdAndUpdate(
      resolvedParams.id,
      updateData,
      { new: true, runValidators: true }
    );

    return NextResponse.json({
      success: true,
      data: updatedProduct,
      message: 'อัพเดทสินค้าสำเร็จ'
    });

  } catch (error) {
    console.error('Error updating product:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/products/[id] - ลบสินค้า
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verify authentication
    const auth = verifyToken(request);
    if (!auth.valid) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const resolvedParams = await params;
    await connectDB();

    // Check if product exists
    const product = await Product.findById(resolvedParams.id);
    if (!product) {
      return NextResponse.json(
        { success: false, error: 'ไม่พบสินค้า' },
        { status: 404 }
      );
    }

    // Delete product
    await Product.findByIdAndDelete(resolvedParams.id);

    return NextResponse.json({
      success: true,
      message: 'ลบสินค้าสำเร็จ'
    });

  } catch (error) {
    console.error('Error deleting product:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}


