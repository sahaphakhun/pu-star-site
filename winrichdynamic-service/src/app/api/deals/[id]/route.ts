import { NextResponse } from 'next/server';
import * as jose from 'jose';
import { cookies } from 'next/headers';
import connectDB from '@/lib/mongodb';
import Deal from '@/models/Deal';
import { updateDealStageSchema } from '@/schemas/deal';

// PATCH /api/deals/:id  { stageId }
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();
    const { id } = await params;
    const body = await request.json();
    const parsed = updateDealStageSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid data', details: parsed.error.issues }, { status: 400 });
    }
    // RBAC: if seller, ensure ownership
    let ownershipFilter: Record<string, any> = { _id: id };
    try {
      const authHeader = (request.headers as any).get?.('authorization') as string | null;
      const bearer = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : undefined;
      const cookieToken = (await cookies()).get('b2b_token')?.value;
      const token = bearer || cookieToken;
      if (token) {
        const payload: any = jose.decodeJwt(token);
        const roleLevel = payload?.roleLevel as number | undefined;
        const adminId = payload?.adminId as string | undefined;
        if (roleLevel && roleLevel >= 5 && adminId) {
          ownershipFilter.ownerId = adminId;
        }
      }
    } catch {}

    const updated = await Deal.findOneAndUpdate(ownershipFilter, { stageId: parsed.data.stageId }, { new: true }).lean();
    if (!updated) return NextResponse.json({ error: 'ไม่พบดีล' }, { status: 404 });
    return NextResponse.json({ success: true, data: updated });
  } catch (err) {
    console.error('[Deals] PATCH error', err);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Deal from '@/models/Deal';
import PipelineStage from '@/models/PipelineStage';
import { updateDealSchema } from '@/schemas/deal';
import Approval from '@/models/Approval';
import { Settings } from '@/models/Settings';

// GET: รายละเอียดดีล
export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    await connectDB();
    const deal = await Deal.findById(id).lean();
    if (!deal) return NextResponse.json({ error: 'ไม่พบดีล' }, { status: 404 });
    return NextResponse.json(deal);
  } catch (error) {
    console.error('[B2B] GET /deals/:id error', error);
    return NextResponse.json({ error: 'ไม่สามารถดึงรายละเอียดดีลได้' }, { status: 500 });
  }
}

// PATCH: อัปเดตดีลทั่วไป หรือย้ายสเตจ
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    await connectDB();
    const body = await request.json();
    const parsed = updateDealSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'ข้อมูลไม่ถูกต้อง', details: parsed.error.issues }, { status: 400 });
    }

    const update: any = { ...parsed.data };
    if (update.stageId) {
      const stage = await PipelineStage.findById(update.stageId).lean();
      if (!stage) return NextResponse.json({ error: 'สเตจไม่ถูกต้อง' }, { status: 400 });
      update.stageName = stage.name;
      if (typeof update.probability === 'undefined' && typeof (stage as any).probability === 'number') {
        update.probability = (stage as any).probability;
      }
      // เคลื่อนสเตจถือว่ามี activity ล่าสุด
      update.lastActivityAt = new Date();
    }

    const updated = await Deal.findByIdAndUpdate(id, update, { new: true });
    const settings: any = await Settings.findOne().lean();
    const NEED_APPROVAL_AMOUNT = settings?.salesPolicy?.approvalAmountThreshold ?? 1_000_000;
    if (updated && typeof updated.amount === 'number' && updated.amount >= NEED_APPROVAL_AMOUNT) {
      const exist = await Approval.findOne({ targetType: 'deal', targetId: id, status: 'pending' });
      if (!exist) {
        await Approval.create({ targetType: 'deal', targetId: id, requestedBy: updated.ownerId, team: updated.team, reason: 'Amount threshold' });
      }
      if (updated.approvalStatus !== 'pending') {
        updated.approvalStatus = 'pending';
        await updated.save();
      }
    }
    if (!updated) return NextResponse.json({ error: 'ไม่พบดีล' }, { status: 404 });
    return NextResponse.json(updated);
  } catch (error) {
    console.error('[B2B] PATCH /deals/:id error', error);
    return NextResponse.json({ error: 'ไม่สามารถอัปเดตดีลได้' }, { status: 500 });
  }
}

// DELETE: ลบดิล
export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    await connectDB();
    const deleted = await Deal.findByIdAndDelete(id);
    if (!deleted) return NextResponse.json({ error: 'ไม่พบดีล' }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[B2B] DELETE /deals/:id error', error);
    return NextResponse.json({ error: 'ไม่สามารถลบดิลได้' }, { status: 500 });
  }
}


