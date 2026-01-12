import { NextResponse } from 'next/server';
import * as jose from 'jose';
import { cookies } from 'next/headers';
import connectDB from '@/lib/mongodb';
import Quotation from '@/models/Quotation';
import { createQuotation, QuotationServiceError } from '@/services/quotationService';

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

    // RBAC: จำกัดข้อมูลสำหรับ Seller
    try {
      const authHeader = (request.headers as any).get?.('authorization') as string | null;
      const bearer = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : undefined;
      const cookieToken = (await cookies()).get('b2b_token')?.value;
      const token = bearer || cookieToken;
      if (token) {
        const payload: any = jose.decodeJwt(token);
        const roleName = String(payload.role || '').toLowerCase();
        if (roleName === 'seller') {
          filter.assignedTo = payload.adminId;
        }
      }
    } catch {}

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
    console.log('[Quotation API] Received data:', JSON.stringify(raw, null, 2));

    let actor;
    try {
      const authHeader = (request.headers as any).get?.('authorization') as string | null;
      const bearer = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : undefined;
      const cookieToken = (await cookies()).get('b2b_token')?.value;
      const token = bearer || cookieToken;
      if (token) {
        const payload: any = jose.decodeJwt(token);
        if (payload?.adminId) {
          actor = { adminId: payload.adminId, role: payload.role };
        }
      }
    } catch {}

    const quotation = await createQuotation(raw, { actor, source: 'api' });

    return NextResponse.json(
      quotation.toObject ? quotation.toObject() : quotation,
      { status: 201 }
    );
    
  } catch (error) {
    if (error instanceof QuotationServiceError) {
      return NextResponse.json(
        { error: error.message, details: error.details },
        { status: error.status }
      );
    }

    console.error('[Quotation API] POST Error:', error);

    // Log detailed error information
    if (error instanceof Error) {
      console.error('[Quotation API] Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
    }
    
    if (error instanceof Error && error.message.includes('duplicate key')) {
      return NextResponse.json(
        { error: 'เลขที่ใบเสนอราคาซ้ำกับที่มีอยู่ในระบบ' },
        { status: 409 }
      );
    }
    
    // Check for validation errors from Mongoose
    if (error instanceof Error && error.message.includes('validation failed')) {
      return NextResponse.json(
        { 
          error: 'ข้อมูลไม่ถูกต้องตามรูปแบบที่กำหนด',
          details: error.message
        },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการสร้างใบเสนอราคา' },
      { status: 500 }
    );
  }
}
