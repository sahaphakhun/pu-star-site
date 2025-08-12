import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Quotation from '@/models/Quotation';
import { createQuotationSchema, searchQuotationSchema } from '@/schemas/quotation';

// GET: ดึงใบเสนอราคาทั้งหมด (พร้อมการค้นหาและ pagination)
export async function GET(request: Request) {
  try {
    await connectDB();
    
    const url = new URL(request.url);
    const searchParams = url.searchParams;
    const page = Number(searchParams.get('page') || '1');
    const limit = Math.min(Number(searchParams.get('limit') || '20'), 100);
    const q = searchParams.get('q') || '';
    const customerId = searchParams.get('customerId');
    const status = searchParams.get('status');
    const assignedTo = searchParams.get('assignedTo');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');

    // สร้าง filter object
    const filter: Record<string, any> = {};
    
    if (q) {
      filter.$or = [
        { quotationNumber: { $regex: q, $options: 'i' } },
        { subject: { $regex: q, $options: 'i' } },
        { customerName: { $regex: q, $options: 'i' } },
      ];
    }
    
    if (customerId) {
      filter.customerId = customerId;
    }
    
    if (status) {
      filter.status = status;
    }
    
    if (assignedTo) {
      filter.assignedTo = { $regex: assignedTo, $options: 'i' };
    }
    
    if (dateFrom || dateTo) {
      filter.createdAt = {};
      if (dateFrom) {
        filter.createdAt.$gte = new Date(dateFrom);
      }
      if (dateTo) {
        filter.createdAt.$lte = new Date(dateTo);
      }
    }

    // นับจำนวนทั้งหมด
    const total = await Quotation.countDocuments(filter);
    
    // ดึงข้อมูลใบเสนอราคา
    const quotations = await Quotation.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    // ถ้าไม่ได้ส่ง query parameters ให้คงรูปแบบ array เดิม
    const hasSearchParams = searchParams.has('page') || searchParams.has('limit') || searchParams.has('q') || 
                           searchParams.has('customerId') || searchParams.has('status') || searchParams.has('assignedTo') ||
                           searchParams.has('dateFrom') || searchParams.has('dateTo');
    
    if (!hasSearchParams) {
      return NextResponse.json(quotations);
    }

    return NextResponse.json({
      data: quotations,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
    
  } catch (error) {
    console.error('[Quotation API] GET Error:', error);
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการดึงข้อมูลใบเสนอราคา' },
      { status: 500 }
    );
  }
}

// POST: สร้างใบเสนอราคาใหม่
export async function POST(request: Request) {
  try {
    const raw = await request.json();
    
    // Validate input data
    const parsed = createQuotationSchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json(
        { 
          error: 'รูปแบบข้อมูลไม่ถูกต้อง', 
          details: parsed.error.issues
        },
        { status: 400 }
      );
    }

    const quotationData = parsed.data;
    
    await connectDB();
    
    // สร้างเลขที่ใบเสนอราคาอัตโนมัติ
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    
    // นับจำนวนใบเสนอราคาในเดือนนี้
    const startOfMonth = new Date(year, today.getMonth(), 1);
    const endOfMonth = new Date(year, today.getMonth() + 1, 0);
    
    const count = await Quotation.countDocuments({
      createdAt: { $gte: startOfMonth, $lte: endOfMonth }
    });
    
    const quotationNumber = `QT${year}${month}${String(count + 1).padStart(3, '0')}`;
    
    // สร้างใบเสนอราคาใหม่
    const quotation = await Quotation.create({
      ...quotationData,
      quotationNumber,
    });
    
    return NextResponse.json(
      quotation.toObject ? quotation.toObject() : quotation,
      { status: 201 }
    );
    
  } catch (error) {
    console.error('[Quotation API] POST Error:', error);
    
    if (error instanceof Error && error.message.includes('duplicate key')) {
      return NextResponse.json(
        { error: 'เลขที่ใบเสนอราคาซ้ำกับที่มีอยู่ในระบบ' },
        { status: 409 }
      );
    }
    
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการสร้างใบเสนอราคา' },
      { status: 500 }
    );
  }
}
