import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Quotation from '@/models/Quotation';
import { updateQuotationStatusSchema } from '@/schemas/quotation';

// PUT: เปลี่ยนสถานะใบเสนอราคา
export async function PUT(
  request: Request,
  context: any
) {
  try {
    const raw = await request.json();
    
    // Validate input data
    const parsed = updateQuotationStatusSchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json(
        { 
          error: 'รูปแบบข้อมูลไม่ถูกต้อง', 
          details: parsed.error.issues 
        },
        { status: 400 }
      );
    }

    const { status, notes } = parsed.data;
    
    await connectDB();
    
    // ตรวจสอบว่าใบเสนอราคามีอยู่จริงหรือไม่
    const existingQuotation = await Quotation.findById(context.params.id);
    if (!existingQuotation) {
      return NextResponse.json(
        { error: 'ไม่พบใบเสนอราคานี้' },
        { status: 404 }
      );
    }
    
    // อัพเดทสถานะและหมายเหตุ
    const updateData: any = { status };
    
    if (status === 'sent') {
      updateData.sentAt = new Date();
    } else if (status === 'accepted' || status === 'rejected') {
      updateData.respondedAt = new Date();
      if (notes) {
        updateData.responseNotes = notes;
      }
    }
    
    const updatedQuotation = await Quotation.findByIdAndUpdate(
      context.params.id,
      updateData,
      { new: true }
    ).lean();
    
    return NextResponse.json(updatedQuotation);
    
  } catch (error) {
    console.error('[Quotation Status API] PUT Error:', error);
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการเปลี่ยนสถานะใบเสนอราคา' },
      { status: 500 }
    );
  }
}
