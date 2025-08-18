import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import SKU from '@/models/SKU';

// GET: ดึงข้อมูล SKU เดี่ยว
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();
    
    const sku = await SKU.findById(params.id).populate('productId', 'name imageUrl');
    
    if (!sku) {
      return NextResponse.json(
        { success: false, error: 'ไม่พบ SKU ที่ระบุ' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ success: true, data: sku });
  } catch (error) {
    console.error('Error fetching SKU:', error);
    return NextResponse.json(
      { success: false, error: 'เกิดข้อผิดพลาดในการดึงข้อมูล SKU' },
      { status: 500 }
    );
  }
}

// PUT: อัปเดต SKU
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();
    
    const body = await request.json();
    const { skuPrefix, unitLabel, options, price, shippingFee, stockQuantity, minStockLevel, maxStockLevel, isActive } = body;
    
    const sku = await SKU.findById(params.id);
    
    if (!sku) {
      return NextResponse.json(
        { success: false, error: 'ไม่พบ SKU ที่ระบุ' },
        { status: 404 }
      );
    }
    
    // อัปเดตข้อมูล
    sku.skuPrefix = skuPrefix || sku.skuPrefix;
    sku.unitLabel = unitLabel !== undefined ? unitLabel : sku.unitLabel;
    sku.options = options !== undefined ? options : sku.options;
    sku.price = price !== undefined ? price : sku.price;
    sku.shippingFee = shippingFee !== undefined ? shippingFee : sku.shippingFee;
    sku.stockQuantity = stockQuantity !== undefined ? stockQuantity : sku.stockQuantity;
    sku.minStockLevel = minStockLevel !== undefined ? minStockLevel : sku.minStockLevel;
    sku.maxStockLevel = maxStockLevel !== undefined ? maxStockLevel : sku.maxStockLevel;
    sku.isActive = isActive !== undefined ? isActive : sku.isActive;
    
    await sku.save();
    
    // ดึงข้อมูลที่อัปเดตแล้ว
    const updatedSku = await SKU.findById(params.id).populate('productId', 'name imageUrl');
    
    return NextResponse.json({ 
      success: true, 
      data: updatedSku,
      message: 'อัปเดต SKU สำเร็จ' 
    });
  } catch (error: any) {
    console.error('Error updating SKU:', error);
    
    if (error.code === 11000) {
      return NextResponse.json(
        { success: false, error: 'SKU Code ซ้ำกัน กรุณาลองใหม่อีกครั้ง' },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { success: false, error: 'เกิดข้อผิดพลาดในการอัปเดต SKU' },
      { status: 500 }
    );
  }
}

// DELETE: ลบ SKU
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();
    
    const sku = await SKU.findById(params.id);
    
    if (!sku) {
      return NextResponse.json(
        { success: false, error: 'ไม่พบ SKU ที่ระบุ' },
        { status: 404 }
      );
    }
    
    await SKU.findByIdAndDelete(params.id);
    
    return NextResponse.json({ 
      success: true, 
      message: 'ลบ SKU สำเร็จ' 
    });
  } catch (error) {
    console.error('Error deleting SKU:', error);
    return NextResponse.json(
      { success: false, error: 'เกิดข้อผิดพลาดในการลบ SKU' },
      { status: 500 }
    );
  }
}
