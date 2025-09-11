import { NextResponse } from 'next/server';
import * as jose from 'jose';
import { cookies } from 'next/headers';
import connectDB from '@/lib/mongodb';
import Quotation from '@/models/Quotation';
import { updateQuotationStatusSchema } from '@/schemas/quotation';

// PUT: เปลี่ยนสถานะใบเสนอราคา
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
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
    const resolvedParams = await params;
    
    // ตรวจสอบว่าใบเสนอราคามีอยู่จริงหรือไม่
    const existingQuotation = await Quotation.findById(resolvedParams.id);
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
    
    // เก็บประวัติการแก้ไขแบบย่อเมื่อเปลี่ยนสถานะ
    const editLog: any = { editedAt: new Date(), remark: `เปลี่ยนสถานะเป็น ${status}`, changedFields: ['status'] };
    try {
      const authHeader = (request as any).headers?.get?.('authorization') as string | null;
      const bearer = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : undefined;
      const cookieToken = (await cookies()).get('b2b_token')?.value;
      const token = bearer || cookieToken;
      if (token) {
        const payload: any = jose.decodeJwt(token);
        if (payload?.adminId) editLog.editedBy = String(payload.adminId);
      }
    } catch {}

    const updatedQuotation = await Quotation.findByIdAndUpdate(
      resolvedParams.id,
      { $set: updateData, $push: { editHistory: editLog } },
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
