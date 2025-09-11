import { NextRequest, NextResponse } from 'next/server';
import * as jose from 'jose';
import { cookies } from 'next/headers';
import connectDB from '@/lib/mongodb';
import Quotation from '@/models/Quotation';
import { updateQuotationSchema } from '@/schemas/quotation';

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
    // RBAC: ถ้าเป็น Seller ต้องเป็นเจ้าของเท่านั้น
    try {
      const authHeader = request.headers.get('authorization');
      const bearer = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : undefined;
      const cookieToken = (await cookies()).get('b2b_token')?.value;
      const token = bearer || cookieToken;
      if (token) {
        const payload: any = jose.decodeJwt(token);
        const roleName = String(payload.role || '').toLowerCase();
        if (roleName === 'seller' && String((quotation as any).assignedTo) !== String(payload.adminId)) {
          return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }
      }
    } catch {}
    
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
    
    const raw = await request.json();
    // Validate + บังคับหมายเหตุ
    const parsed = updateQuotationSchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json({ error: 'รูปแบบข้อมูลไม่ถูกต้อง', details: parsed.error.issues }, { status: 400 });
    }
    const body = parsed.data as any;
    
    const resolvedParams = await params;
    // RBAC: ตรวจสิทธิ์เป็นเจ้าของก่อน (เฉพาะ Seller)
    try {
      const authHeader = request.headers.get('authorization');
      const bearer = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : undefined;
      const cookieToken = (await cookies()).get('b2b_token')?.value;
      const token = bearer || cookieToken;
      if (token) {
        const payload: any = jose.decodeJwt(token);
        const roleName = String(payload.role || '').toLowerCase();
        if (roleName === 'seller') {
          const existing = await Quotation.findById((await params).id).lean();
          if (!existing || String((existing as any).assignedTo) !== String(payload.adminId)) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
          }
        }
      }
    } catch {}

    // เตรียมบันทึกประวัติการแก้ไข
    const changedFields = Object.keys({ ...body });
    const editLog = {
      editedAt: new Date(),
      editedBy: undefined as string | undefined,
      remark: String(body.remark),
      changedFields: changedFields.filter(k => k !== 'remark'),
    };

    // ดึง token เพื่อเก็บผู้แก้ไข
    try {
      const authHeader = request.headers.get('authorization');
      const bearer = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : undefined;
      const cookieToken = (await cookies()).get('b2b_token')?.value;
      const token = bearer || cookieToken;
      if (token) {
        const payload: any = jose.decodeJwt(token);
        if (payload?.adminId) editLog.editedBy = String(payload.adminId);
      }
    } catch {}

    // ไม่เก็บ remark ในตัวเอกสารหลัก
    delete (body as any).remark;

    const quotation = await Quotation.findByIdAndUpdate(
      resolvedParams.id,
      { $set: body, $push: { editHistory: editLog } },
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
    // RBAC: ตรวจสิทธิ์เป็นเจ้าของก่อน (เฉพาะ Seller)
    try {
      const authHeader = request.headers.get('authorization');
      const bearer = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : undefined;
      const cookieToken = (await cookies()).get('b2b_token')?.value;
      const token = bearer || cookieToken;
      if (token) {
        const payload: any = jose.decodeJwt(token);
        const roleName = String(payload.role || '').toLowerCase();
        if (roleName === 'seller') {
          const existing = await Quotation.findById(resolvedParams.id).lean();
          if (!existing || String((existing as any).assignedTo) !== String(payload.adminId)) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
          }
        }
      }
    } catch {}

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
