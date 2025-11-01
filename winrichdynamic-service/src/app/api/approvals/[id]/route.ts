import { NextRequest, NextResponse } from 'next/server';
import * as jose from 'jose';
import { cookies } from 'next/headers';
import connectDB from '@/lib/mongodb';
import Approval from '@/models/Approval';
import { updateApprovalSchema } from '@/schemas/approval';
import Quotation from '@/models/Quotation';

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    await connectDB();
    const body = await request.json();
    const parsed = updateApprovalSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: 'ข้อมูลไม่ถูกต้อง', details: parsed.error.issues }, { status: 400 });

    // ตรวจ role: เฉพาะ manager/admin เท่านั้นที่อนุมัติได้
    let canApprove = false;
    let approverId: string | undefined;
    try {
      const authHeader = request.headers.get('authorization');
      const bearer = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : undefined;
      const cookieToken = (await cookies()).get('b2b_token')?.value;
      const token = bearer || cookieToken;
      if (token) {
        const payload: any = jose.decodeJwt(token);
        approverId = payload.adminId;
        const role = String(payload.role || '').toLowerCase();
        if (role === 'manager' || role === 'admin') canApprove = true;
      }
    } catch {}

    if (!canApprove) return NextResponse.json({ error: 'ไม่มีสิทธิ์อนุมัติ' }, { status: 403 });

    const updated = await Approval.findByIdAndUpdate(
      id,
      { $set: { status: parsed.data.status, decisionReason: parsed.data.decisionReason, approverId } },
      { new: true }
    );
    if (!updated) return NextResponse.json({ error: 'ไม่พบคำขออนุมัติ' }, { status: 404 });

    // หาก target เป็นใบเสนอราคา ให้สะท้อนสถานะไปที่เอกสารใบเสนอราคาด้วย
    try {
      if (updated.targetType === 'quotation') {
        await Quotation.updateOne({ _id: updated.targetId }, { $set: { approvalStatus: updated.status } });
      }
    } catch {}
    return NextResponse.json(updated);
  } catch (error) {
    console.error('[B2B] PATCH /approvals/:id error', error);
    return NextResponse.json({ error: 'ไม่สามารถอัปเดตคำขออนุมัติได้' }, { status: 500 });
  }
}


