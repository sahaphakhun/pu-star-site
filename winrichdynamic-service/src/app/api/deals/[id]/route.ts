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


