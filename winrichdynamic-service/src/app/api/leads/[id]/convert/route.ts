import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Lead from '@/models/Lead';
import Deal from '@/models/Deal';
import PipelineStage from '@/models/PipelineStage';
import { convertLeadSchema } from '@/schemas/lead';

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();
    const { id } = await params;
    const payload = await request.json().catch(() => ({}));
    const parsed = convertLeadSchema.safeParse(payload);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid data', details: parsed.error.issues }, { status: 400 });
    }

    const lead = await Lead.findById(id);
    if (!lead) return NextResponse.json({ error: 'ไม่พบ Lead' }, { status: 404 });
    if (lead.status === 'converted') {
      return NextResponse.json({ error: 'Lead ถูกแปลงแล้ว' }, { status: 400 });
    }

    // เลือก stage แรกสุดเป็นค่าเริ่มต้น
    const firstStage = await PipelineStage.findOne().sort({ order: 1 }).lean();
    const stageId = parsed.data.stageId || String(firstStage?._id || '');

    const deal = await Deal.create({
      title: parsed.data.title || (lead.company ? `${lead.company} - ดีลใหม่` : `${lead.name} - ดีลใหม่`),
      customerId: lead.customerId,
      customerName: lead.company || lead.name,
      amount: parsed.data.amount ?? 0,
      stageId: stageId || 'default',
      status: 'open',
      ownerId: lead.ownerId,
    });

    lead.status = 'converted';
    await lead.save();

    return NextResponse.json({ success: true, data: { lead, deal } });
  } catch (err) {
    console.error('[Leads Convert] POST error', err);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import * as jose from 'jose';
import { cookies } from 'next/headers';
import connectDB from '@/lib/mongodb';
import Lead from '@/models/Lead';
import Customer from '@/models/Customer';
import Deal from '@/models/Deal';

export async function POST(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    await connectDB();
    const lead = await Lead.findById(id);
    if (!lead) return NextResponse.json({ error: 'ไม่พบ lead' }, { status: 404 });

    // สร้างลูกค้า (ถ้ายังไม่มีจาก email/phone ซ้ำ)
    let customer = null as any;
    if (lead.email) customer = await Customer.findOne({ email: lead.email });
    if (!customer && lead.phone) customer = await Customer.findOne({ phoneNumber: lead.phone });
    if (!customer) {
      customer = await Customer.create({ name: lead.name, phoneNumber: lead.phone || '+66000000000', companyName: lead.company, notes: lead.notes, assignedTo: lead.ownerId });
    }

    // สร้างดีลเริ่มต้น
    const deal = await Deal.create({ title: `ดีลจาก Lead: ${lead.name}`, customerId: String(customer._id), customerName: customer.companyName ? `${customer.companyName} (${customer.name})` : customer.name, amount: 0, stageId: '', status: 'open', ownerId: lead.ownerId, team: lead.team, approvalStatus: 'none' });

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


