import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import ContactForm from '@/models/ContactForm';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    // ดึงข้อมูลข้อความติดต่อทั้งหมด เรียงตามวันที่ล่าสุด
    const contactForms = await ContactForm.find({})
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({ 
      success: true, 
      contactForms 
    });

  } catch (error) {
    console.error('[Admin Contact Forms] เกิดข้อผิดพลาด:', error);
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการดึงข้อมูล' },
      { status: 500 }
    );
  }
}
