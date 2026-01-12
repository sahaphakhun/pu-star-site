import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Quotation from '@/models/Quotation';
import { sendQuotationSchema } from '@/schemas/quotation';
import { sendLineTextToCustomerGroups } from '@/app/notification/group';

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
    
    // ส่งแจ้งเตือน LINE กลุ่มตาม customer ที่ผูก
    try {
      if (method === 'line' && updatedQuotation) {
        const base = (process.env.NEXT_PUBLIC_APP_URL || '').replace(/\/$/, '');
        const origin = new URL(request.url).origin;
        const baseUrl = base || origin;
        const viewUrl = `${baseUrl}/quotation/${resolvedParams.id}`;
        const qn = (updatedQuotation as any).quotationNumber || resolvedParams.id;
        const msg = `ส่งใบเสนอราคา ${qn}\nดูใบเสนอราคา: ${viewUrl}`;
        await sendLineTextToCustomerGroups(String((updatedQuotation as any).customerId), msg);
      }
    } catch (e) {
      console.warn('[Quotation Send] LINE notify failed:', e);
    }

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
