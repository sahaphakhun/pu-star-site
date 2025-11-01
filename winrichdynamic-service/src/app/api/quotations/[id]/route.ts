import { NextRequest, NextResponse } from 'next/server';
import * as jose from 'jose';
import { cookies } from 'next/headers';
import connectDB from '@/lib/mongodb';
import Quotation from '@/models/Quotation';
import { updateQuotationSchema } from '@/schemas/quotation';
import Approval from '@/models/Approval';
import { Settings } from '@/models/Settings';
import { checkDiscountGuardrails } from '@/utils/pricing';

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

    if (body.shipToSameAsCustomer) {
      body.shippingAddress = body.customerAddress;
    }
    
    const resolvedParams = await params;
    const existingBeforeUpdate = await Quotation.findById(resolvedParams.id).lean();
    if (!existingBeforeUpdate) {
      return NextResponse.json({ error: 'ไม่พบใบเสนอราคา' }, { status: 404 });
    }
    // ถ้าไม่ใช่ draft ให้ล็อกไม่ให้แก้ไขรายการ/ราคา/ส่วนลด เพื่อคงเอกสารเดิม
    if ((existingBeforeUpdate as any).status !== 'draft') {
      const blockedKeys = ['items','subtotal','totalDiscount','specialDiscount','totalAmount','vatRate','vatAmount','grandTotal','priceBookId','paymentTerms','deliveryTerms'];
      const hasBlocked = Object.keys(body).some(k => blockedKeys.includes(k));
      if (hasBlocked) {
        return NextResponse.json({ error: 'เอกสารไม่อยู่ในสถานะร่าง ไม่สามารถแก้ไขรายละเอียดราคา/รายการได้' }, { status: 400 });
      }
    }
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
          const existing = existingBeforeUpdate;
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

    // Guardrails: ตรวจ PriceBook/DiscountPolicy + Global settings
    let requireApproval = false;
    try {
      if (Array.isArray((body as any).items) && (body as any).items.length > 0) {
        const guard = await checkDiscountGuardrails(
          (body as any).items.map((i: any) => ({
            productId: i.productId,
            quantity: Number(i.quantity),
            unitPrice: Number(i.unitPrice),
            discount: Number(i.discount || 0),
          })),
          { role: undefined, customerGroup: undefined }
        );
        if (!guard.ok) {
          return NextResponse.json({ error: 'ส่วนลดบางรายการไม่เป็นไปตามนโยบาย', violations: guard.violations, requiresApproval: guard.requiresApproval }, { status: 400 });
        }
        if (guard.requiresApproval) requireApproval = true;
      }
    } catch {}

    if (requireApproval) {
      (body as any).approvalStatus = 'pending';
      (body as any).approvalReason = (body as any).approvalReason || 'ส่วนลดเกินนโยบาย';
    }

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
    
    // สร้าง approval entry หากจำเป็น
    try {
      if (requireApproval) {
        await Approval.updateOne(
          { targetType: 'quotation', targetId: String(resolvedParams.id), status: 'pending' },
          { $setOnInsert: { targetType: 'quotation', targetId: String(resolvedParams.id), requestedBy: editLog.editedBy || 'system', reason: (body as any).approvalReason } },
          { upsert: true }
        );
      }
    } catch (e) {
      console.error('[Quotation API] Update approval entry failed', e);
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
