import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import ContactForm from '@/models/ContactForm';

export const dynamic = 'force-dynamic';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();
    const { status, adminNotes } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'ไม่พบ ID ของข้อความติดต่อ' },
        { status: 400 }
      );
    }

    await connectDB();

    // อัปเดตสถานะและบันทึกหมายเหตุของแอดมิน
    const updatedForm = await ContactForm.findByIdAndUpdate(
      id,
      { 
        status: status || 'new',
        ...(adminNotes && { adminNotes })
      },
      { new: true }
    ).lean();

    if (!updatedForm) {
      return NextResponse.json(
        { error: 'ไม่พบข้อความติดต่อที่ต้องการอัปเดต' },
        { status: 404 }
      );
    }

    return NextResponse.json({ 
      success: true, 
      contactForm: updatedForm 
    });

  } catch (error) {
    console.error('[Admin Contact Form Update] เกิดข้อผิดพลาด:', error);
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการอัปเดตข้อมูล' },
      { status: 500 }
    );
  }
}
