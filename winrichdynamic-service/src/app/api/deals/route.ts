// Removed duplicated legacy block; file below provides the single implementation

import { NextRequest, NextResponse } from 'next/server';
import * as jose from 'jose';
import { cookies } from 'next/headers';
import connectDB from '@/lib/mongodb';
import Deal from '@/models/Deal';
import Customer from '@/models/Customer';
import PipelineStage from '@/models/PipelineStage';
import { createDealSchema, searchDealSchema } from '@/schemas/deal';
import { buildDealsFilter } from './filter';
import Approval from '@/models/Approval';
import { Settings } from '@/models/Settings';

// GET: list with filters + pagination
export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const url = new URL(request.url);
    const params = Object.fromEntries(url.searchParams.entries());
    const parsed = searchDealSchema.safeParse(params);
    const page = parsed.success ? parsed.data.page : 1;
    const limit = parsed.success ? parsed.data.limit : 20;
    let filter: Record<string, any> = {};
    try {
      const authHeader = request.headers.get('authorization');
      const bearer = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : undefined;
      const cookieToken = (await cookies()).get('b2b_token')?.value;
      const token = bearer || cookieToken;
      const payload: any = token ? jose.decodeJwt(token) : {};
      filter = buildDealsFilter(url.searchParams, { role: (payload.role || '').toLowerCase(), adminId: payload.adminId, team: payload.team });
    } catch {
      filter = buildDealsFilter(url.searchParams, {});
    }

    const total = await Deal.countDocuments(filter);
    const deals = await Deal.find(filter)
      .sort({ updatedAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    const hasSearchParams = url.searchParams.size > 0;
    if (!hasSearchParams) return NextResponse.json(deals);
    return NextResponse.json({ data: deals, total, page, limit, totalPages: Math.ceil(total / limit) });
  } catch (error) {
    console.error('[B2B] GET /deals error', error);
    return NextResponse.json({ error: 'ไม่สามารถดึงรายการดีลได้' }, { status: 500 });
  }
}

// POST: create deal
export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const body = await request.json();
    const parsed = createDealSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'ข้อมูลไม่ถูกต้อง', details: parsed.error.issues }, { status: 400 });
    }
    const data = parsed.data as any;

    // enrich customerName
    if (!data.customerName && data.customerId) {
      const customer = await Customer.findById(data.customerId).lean();
      if (customer) data.customerName = customer.companyName ? `${customer.companyName} (${customer.name})` : customer.name;
    }

    // enrich stageName and probability default
    if (data.stageId) {
      const stage = await PipelineStage.findById(data.stageId).lean();
      if (stage) {
        data.stageName = data.stageName || stage.name;
        if (typeof data.probability === 'undefined' && typeof (stage as any).probability === 'number') {
          data.probability = (stage as any).probability;
        }
      }
    }

    // set ownerId/team from token if exists
    try {
      const authHeader = request.headers.get('authorization');
      const bearer = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : undefined;
      const cookieToken = (await cookies()).get('b2b_token')?.value;
      const token = bearer || cookieToken;
      if (token) {
        const payload: any = jose.decodeJwt(token);
        if (payload?.adminId) data.ownerId = payload.adminId;
        if (payload?.team) data.team = payload.team;
      }
    } catch {}

    // โหลด threshold จาก Settings
    const settings: any = await Settings.findOne().lean();
    const NEED_APPROVAL_AMOUNT = settings?.salesPolicy?.approvalAmountThreshold ?? 1_000_000;
    if (typeof data.amount === 'number' && data.amount >= NEED_APPROVAL_AMOUNT) {
      data.approvalStatus = 'pending';
      const temp = await Approval.create({ targetType: 'deal', targetId: 'pending', requestedBy: data.ownerId, team: data.team, reason: 'Amount threshold' });
      const deal = await Deal.create(data);
      await Approval.updateOne({ _id: temp._id }, { $set: { targetId: String(deal._id) } });
      return NextResponse.json(deal, { status: 201 });
    }
    const deal = await Deal.create(data);
    return NextResponse.json(deal, { status: 201 });
  } catch (error) {
    console.error('[B2B] POST /deals error', error);
    return NextResponse.json({ error: 'ไม่สามารถสร้างดีลได้' }, { status: 500 });
  }
}


