import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Quotation from '@/models/Quotation';

// GET: ดึงข้อมูลใบเสนอราคาเดียว
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    
    const resolvedParams = await params;
    const quotation = await Quotation.findById(resolvedParams.id).lean();
    
    if (!quotation) {
      return NextResponse.json(
        { error: 'ไม่พบใบเสนอราคา' },
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

// PUT: อัพเดทใบเสนอราคา
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    
    const body = await request.json();
    
    const resolvedParams = await params;
    const quotation = await Quotation.findByIdAndUpdate(
      resolvedParams.id,
      body,
      { new: true, runValidators: true }
    ).lean();
    
    if (!quotation) {
      return NextResponse.json(
        { error: 'ไม่พบใบเสนอราคา' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(quotation);
    
  } catch (error) {
    console.error('[Quotation API] PUT Error:', error);
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการอัพเดทใบเสนอราคา' },
      { status: 500 }
    );
  }
}

// DELETE: ลบใบเสนอราคา
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    
    const resolvedParams = await params;
    const quotation = await Quotation.findByIdAndDelete(resolvedParams.id);
    
    if (!quotation) {
      return NextResponse.json(
        { error: 'ไม่พบใบเสนอราคา' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ message: 'ลบใบเสนอราคาเรียบร้อยแล้ว' });
    
  } catch (error) {
    console.error('[Quotation API] DELETE Error:', error);
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการลบใบเสนอราคา' },
      { status: 500 }
    );
  }
}
