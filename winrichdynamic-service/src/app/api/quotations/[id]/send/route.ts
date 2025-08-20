import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Quotation from '@/models/Quotation';
import { sendQuotationSchema } from '@/schemas/quotation';

// POST: ส่งใบเสนอราคา
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const raw = await request.json();
    
    // Validate input data
    const parsed = sendQuotationSchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json(
        { 
          error: 'รูปแบบข้อมูลไม่ถูกต้อง', 
          details: parsed.error.issues 
        },
        { status: 400 }
      );
    }

    const { method, sentBy, notes } = parsed.data;
    
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
    
    // ตรวจสอบสถานะใบเสนอราคา
    if (existingQuotation.status !== 'draft') {
      return NextResponse.json(
        { error: 'สามารถส่งได้เฉพาะใบเสนอราคาที่เป็นร่างเท่านั้น' },
        { status: 400 }
      );
    }
    
    // อัพเดทข้อมูลการส่ง
    const updateData = {
      status: 'sent',
      sentAt: new Date(),
      sentBy,
      sentMethod: method,
      notes: notes || existingQuotation.notes,
    };
    
    const updatedQuotation = await Quotation.findByIdAndUpdate(
      resolvedParams.id,
      updateData,
      { new: true }
    ).lean();
    
    // TODO: ในอนาคตจะเพิ่มการส่งอีเมลหรือ LINE ตาม method ที่เลือก
    
    return NextResponse.json({
      message: 'ส่งใบเสนอราคาเรียบร้อยแล้ว',
      quotation: updatedQuotation
    });
    
  } catch (error) {
    console.error('[Quotation Send API] POST Error:', error);
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการส่งใบเสนอราคา' },
      { status: 500 }
    );
  }
}
