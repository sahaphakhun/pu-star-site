import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Quotation from '@/models/Quotation';
import { convertToOrderSchema } from '@/schemas/quotation';

// POST: แปลงใบเสนอราคาเป็น Sales Order
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const raw = await request.json();
    
    // Validate input data
    const parsed = convertToOrderSchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json(
        { 
          error: 'รูปแบบข้อมูลไม่ถูกต้อง', 
          details: parsed.error.issues 
        },
        { status: 400 }
      );
    }

    const { orderNumber, notes } = parsed.data;
    
    await connectDB();
    const resolvedParams = await params;
    
    // ตรวจสอบว่าใบเสนอราคามีอยู่จริงหรือไม่
    const existingQuotation = await Quotation.findById(resolvedParams.id);
    if (!existingQuotation) {
      return NextResponse.json(
        { error: 'ไม่พบใบเสนอราคานี้' },
        { status: 404 }
      );
    }
    
    // อนุญาตให้แปลงเป็น Sales Order ได้ทุกสถานะตามนโยบายใหม่
    
    // ตรวจสอบว่าใบเสนอราคานี้ถูกแปลงเป็น Sales Order แล้วหรือไม่
    if (existingQuotation.convertedToOrder) {
      return NextResponse.json(
        { error: 'ใบเสนอราคานี้ถูกแปลงเป็น Sales Order แล้ว' },
        { status: 400 }
      );
    }
    
    // อัพเดทข้อมูลการแปลง
    const updateData = {
      convertedToOrder: orderNumber,
      notes: notes || existingQuotation.notes,
    };
    
    const updatedQuotation = await Quotation.findByIdAndUpdate(
      resolvedParams.id,
      updateData,
      { new: true }
    ).lean();
    
    // TODO: ในอนาคตจะสร้าง Sales Order ในระบบ
    
    return NextResponse.json({
      message: 'แปลงใบเสนอราคาเป็น Sales Order เรียบร้อยแล้ว',
      quotation: updatedQuotation,
      orderNumber
    });
    
  } catch (error) {
    console.error('[Quotation Convert API] POST Error:', error);
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการแปลงใบเสนอราคา' },
      { status: 500 }
    );
  }
}
