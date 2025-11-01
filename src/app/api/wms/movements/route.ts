import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Product from '@/models/Product';

// GET: ดึงข้อมูลการเคลื่อนไหวทั้งหมด
export async function GET() {
  try {
    await connectDB();
    
    // สำหรับตอนนี้จะใช้ mock data เนื่องจากยังไม่มี model สำหรับ StockMovement
    // ในอนาคตควรสร้าง StockMovement model และเก็บข้อมูลจริง
    
    const mockMovements = [
      {
        _id: '1',
        type: 'in' as const,
        productId: 'product1',
        productName: 'สินค้าตัวอย่าง 1',
        quantity: 100,
        reference: 'PO001',
        referenceType: 'ใบสั่งซื้อ',
        notes: 'สินค้าจากซัพพลายเออร์ A',
        timestamp: new Date().toISOString(),
        createdBy: 'admin@winrich.com'
      },
      {
        _id: '2',
        type: 'out' as const,
        productId: 'product2',
        productName: 'สินค้าตัวอย่าง 2',
        quantity: 50,
        reference: 'SO001',
        referenceType: 'ใบสั่งขาย',
        notes: 'ส่งให้ลูกค้า B',
        timestamp: new Date(Date.now() - 86400000).toISOString(),
        createdBy: 'admin@winrich.com'
      },
      {
        _id: '3',
        type: 'adjustment' as const,
        productId: 'product3',
        productName: 'สินค้าตัวอย่าง 3',
        quantity: 10,
        reference: 'ADJ001',
        referenceType: 'การปรับปรุงสต็อก',
        notes: 'ปรับปรุงจากการนับสต็อกจริง',
        timestamp: new Date(Date.now() - 172800000).toISOString(),
        createdBy: 'admin@winrich.com'
      }
    ];

    return NextResponse.json(mockMovements);
  } catch (error) {
    console.error('[WMS Movements API] GET Error:', error);
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการดึงข้อมูลการเคลื่อนไหว' },
      { status: 500 }
    );
  }
}

// POST: สร้างการเคลื่อนไหวใหม่
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, productId, quantity, reference, referenceType, notes } = body;

    if (!type || !productId || !quantity || !reference) {
      return NextResponse.json(
        { error: 'กรุณากรอกข้อมูลให้ครบถ้วน' },
        { status: 400 }
      );
    }

    await connectDB();

    // หาสินค้าที่ต้องการปรับปรุงสต็อก
    const product = await Product.findById(productId);
    if (!product) {
      return NextResponse.json(
        { error: 'ไม่พบสินค้าที่ระบุ' },
        { status: 404 }
      );
    }

    // คำนวณสต็อกใหม่
    let newStock = product.stock;
    switch (type) {
      case 'in':
        newStock += quantity;
        break;
      case 'out':
        if (product.stock < quantity) {
          return NextResponse.json(
            { error: 'สินค้าคงเหลือไม่เพียงพอ' },
            { status: 400 }
          );
        }
        newStock -= quantity;
        break;
      case 'adjustment':
        newStock = quantity; // ตั้งค่าสต็อกใหม่ตามที่ระบุ
        break;
      default:
        return NextResponse.json(
          { error: 'ประเภทการเคลื่อนไหวไม่ถูกต้อง' },
          { status: 400 }
        );
    }

    // อัปเดตสต็อกสินค้า
    await Product.findByIdAndUpdate(productId, {
      stock: newStock,
      updatedAt: new Date()
    });

    // ในอนาคตควรบันทึกการเคลื่อนไหวลงใน StockMovement collection
    // สำหรับตอนนี้จะ return success response

    return NextResponse.json({
      success: true,
      message: 'บันทึกการเคลื่อนไหวเรียบร้อยแล้ว',
      data: {
        productId,
        productName: product.name,
        oldStock: product.stock,
        newStock,
        change: type === 'adjustment' ? 'set' : (type === 'in' ? '+' : '-') + Math.abs(quantity)
      }
    }, { status: 201 });

  } catch (error) {
    console.error('[WMS Movements API] POST Error:', error);
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการบันทึกการเคลื่อนไหว' },
      { status: 500 }
    );
  }
}
