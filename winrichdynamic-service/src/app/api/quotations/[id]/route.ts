import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Quotation from '@/models/Quotation';
import { updateQuotationSchema } from '@/schemas/quotation';

// GET: ดึงข้อมูลใบเสนอราคาตาม ID
export async function GET(
  request: Request,
  context: any
) {
  try {
    await connectDB();
    
    const quotation = await Quotation.findById(context.params.id).lean();
    
    if (!quotation) {
      return NextResponse.json(
        { error: 'ไม่พบใบเสนอราคานี้' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(quotation);
    
  } catch (error) {
    console.error('[Quotation API] GET by ID Error:', error);
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการดึงข้อมูลใบเสนอราคา' },
      { status: 500 }
    );
  }
}

// PUT: อัพเดทข้อมูลใบเสนอราคา
export async function PUT(
  request: Request,
  context: any
) {
  try {
    const raw = await request.json();
    
    // Validate input data
    const parsed = updateQuotationSchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json(
        { 
          error: 'รูปแบบข้อมูลไม่ถูกต้อง', 
          details: parsed.error.errors 
        },
        { status: 400 }
      );
    }

    const updateData = parsed.data;
    
    await connectDB();
    
    // ตรวจสอบว่าใบเสนอราคามีอยู่จริงหรือไม่
    const existingQuotation = await Quotation.findById(context.params.id);
    if (!existingQuotation) {
      return NextResponse.json(
        { error: 'ไม่พบใบเสนอราคานี้' },
        { status: 404 }
      );
    }
    
    // อัพเดทข้อมูลใบเสนอราคา
    const updatedQuotation = await Quotation.findByIdAndUpdate(
      context.params.id,
      updateData,
      { 
        new: true, 
        runValidators: true 
      }
    ).lean();
    
    return NextResponse.json(updatedQuotation);
    
  } catch (error) {
    console.error('[Quotation API] PUT Error:', error);
    
    if (error instanceof Error && error.message.includes('duplicate key')) {
      return NextResponse.json(
        { error: 'ข้อมูลใบเสนอราคาซ้ำกับที่มีอยู่ในระบบ' },
        { status: 409 }
      );
    }
    
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการอัพเดทข้อมูลใบเสนอราคา' },
      { status: 500 }
    );
  }
}

// DELETE: ลบใบเสนอราคา
export async function DELETE(
  request: Request,
  context: any
) {
  try {
    await connectDB();
    
    // ตรวจสอบว่าใบเสนอราคามีอยู่จริงหรือไม่
    const existingQuotation = await Quotation.findById(context.params.id);
    if (!existingQuotation) {
      return NextResponse.json(
        { error: 'ไม่พบใบเสนอราคานี้' },
        { status: 404 }
      );
    }
    
    // ตรวจสอบว่าใบเสนอราคาสามารถลบได้หรือไม่
    if (existingQuotation.status === 'sent' || existingQuotation.status === 'accepted') {
      return NextResponse.json(
        { error: 'ไม่สามารถลบใบเสนอราคาที่ส่งแล้วหรือลูกค้ายอมรับแล้วได้' },
        { status: 400 }
      );
    }
    
    // ลบใบเสนอราคา
    await Quotation.findByIdAndDelete(context.params.id);
    
    return NextResponse.json({
      message: 'ลบใบเสนอราคาเรียบร้อยแล้ว'
    });
    
  } catch (error) {
    console.error('[Quotation API] DELETE Error:', error);
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการลบใบเสนอราคา' },
      { status: 500 }
    );
  }
}
