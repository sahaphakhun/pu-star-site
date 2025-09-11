import { NextRequest, NextResponse } from 'next/server';
import * as jose from 'jose';
import { cookies } from 'next/headers';
import connectDB from '@/lib/mongodb';
import Lead from '@/models/Lead';
import Customer from '@/models/Customer';
import Deal from '@/models/Deal';
import PipelineStage from '@/models/PipelineStage';

export async function POST(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    await connectDB();
    const lead = await Lead.findById(id);
    if (!lead) return NextResponse.json({ error: 'ไม่พบ lead' }, { status: 404 });

    // สร้างลูกค้า (ถ้ายังไม่มีจาก email/phone ซ้ำ)
    let customer = null as any;
    const normalizeThaiPhone = (input?: string | null) => {
      const raw = (input || '').trim();
      if (!raw) return '+66000000000';
      if (raw.startsWith('+66')) return raw;
      if (raw.startsWith('0') && raw.length >= 10) return `+66${raw.slice(1)}`;
      // fallback: ถ้าไม่เข้าเงื่อนไข ให้บังคับเป็นเบอร์ placeholder เพื่อไม่ให้ validation ล้มเหลว
      return '+66000000000';
    };
    if (lead.email) customer = await Customer.findOne({ email: lead.email });
    if (!customer && lead.phone) {
      const normalized = normalizeThaiPhone(lead.phone);
      customer = await Customer.findOne({ phoneNumber: normalized });
    }
    if (!customer) {
      customer = await Customer.create({
        name: lead.name,
        phoneNumber: normalizeThaiPhone(lead.phone),
        companyName: lead.company,
        notes: lead.notes,
        assignedTo: lead.ownerId,
      });
    }

    // สร้างดีลเริ่มต้น
    // หา default stage: ตาม team ของ lead ก่อน ถ้าไม่มีใช้ตัวแรกตาม order
    const teamFilter: any = lead.team ? { team: lead.team } : {};
    let stage: any = await PipelineStage.findOne({ ...teamFilter, isDefault: true }).sort({ order: 1 }).lean();
    if (!stage) stage = await PipelineStage.findOne(teamFilter).sort({ order: 1 }).lean();
    if (!stage) stage = await PipelineStage.findOne({}).sort({ order: 1 }).lean();
    if (!stage) {
      // ถ้าไม่มีสเตจเลย ให้สร้างเริ่มต้นอัตโนมัติ
      const created = await PipelineStage.create({
        name: 'เริ่มต้น',
        order: 0,
        probability: 0,
        isDefault: true,
        team: lead.team,
      } as any);
      stage = created.toObject();
    }

    const deal = await Deal.create({
      title: `ดีลจาก Lead: ${lead.name}`,
      customerId: String(customer._id),
      customerName: customer.companyName ? `${customer.companyName} (${customer.name})` : customer.name,
      amount: 0,
      stageId: String((stage as any)._id),
      stageName: (stage as any).name,
      status: 'open',
      ownerId: lead.ownerId,
      team: lead.team,
      approvalStatus: 'none',
      probability: typeof (stage as any).probability === 'number' ? (stage as any).probability : undefined,
    });

    lead.status = 'converted';
    lead.customerId = String(customer._id);
    lead.dealId = String(deal._id);
    await lead.save();

    return NextResponse.json({ customer, deal });
  } catch (error) {
    console.error('[B2B] POST /leads/:id/convert error', error);
    return NextResponse.json({ error: 'ไม่สามารถแปลง lead ได้' }, { status: 500 });
  }
}


