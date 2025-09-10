import { NextRequest, NextResponse } from 'next/server';
import * as jose from 'jose';
import { cookies } from 'next/headers';
import connectDB from '@/lib/mongodb';
import Lead from '@/models/Lead';
import Customer from '@/models/Customer';
import Deal from '@/models/Deal';

export async function POST(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await connectDB();
    const lead = await Lead.findById(params.id);
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


