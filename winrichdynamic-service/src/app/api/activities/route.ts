// Removed duplicated legacy block; single implementation below

import { NextRequest, NextResponse } from 'next/server';
import * as jose from 'jose';
import { cookies } from 'next/headers';
import connectDB from '@/lib/mongodb';
import Activity from '@/models/Activity';
import Deal from '@/models/Deal';
import mongoose from 'mongoose';
import { createActivitySchema } from '@/schemas/activity';
import Customer from '@/models/Customer';

// GET: list activities with filters
export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const url = new URL(request.url);
    const page = Number(url.searchParams.get('page') || '1');
    const limit = Math.min(Number(url.searchParams.get('limit') || '20'), 100);

    const filter: Record<string, any> = {};
    const customerId = url.searchParams.get('customerId') || undefined;
    const dealId = url.searchParams.get('dealId') || undefined;
    const quotationIds = url.searchParams.getAll('quotationId');
    const status = url.searchParams.get('status') || undefined;
    const type = url.searchParams.get('type') || undefined;

    if (customerId) filter.customerId = customerId;
    if (dealId) filter.dealId = dealId;
    if (quotationIds && quotationIds.length) {
      filter.quotationId = { $in: quotationIds };
    }
    if (status) filter.status = status;
    if (type) filter.type = type;

    // RBAC: ถ้าเป็น seller เห็นเฉพาะ ownerId ของตนเอง
    try {
      const authHeader = request.headers.get('authorization');
      const bearer = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : undefined;
      const cookieToken = (await cookies()).get('b2b_token')?.value;
      const token = bearer || cookieToken;
      if (token) {
        const payload: any = jose.decodeJwt(token);
        const roleName = String(payload.role || '').toLowerCase();
        if (roleName === 'seller') filter.ownerId = payload.adminId;
      }
    } catch {}

    const total = await Activity.countDocuments(filter);
    const items = await Activity.find(filter)
      .sort({ scheduledAt: -1, createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    const customerIds = Array.from(
      new Set(
        items
          .map((item) => item.customerId)
          .filter((id): id is string => typeof id === 'string' && id.trim().length > 0)
      )
    );

    const validCustomerObjectIds = customerIds.filter((id) => mongoose.Types.ObjectId.isValid(id));
    let customerMap = new Map<string, string>();

    if (validCustomerObjectIds.length > 0) {
      const customers = await Customer.find({ _id: { $in: validCustomerObjectIds } })
        .select(['name', 'companyName'])
        .lean();

      customers.forEach((customer) => {
        const displayName = customer.companyName
          ? `${customer.companyName} (${customer.name})`
          : customer.name;
        customerMap.set(customer._id.toString(), displayName);
      });
    }

    const itemsWithNames = items.map((item) => ({
      ...item,
      customerName: item.customerId ? customerMap.get(item.customerId) || item.customerId : undefined,
    }));

    const hasParams = url.searchParams.size > 0;
    if (!hasParams) return NextResponse.json(itemsWithNames);
    return NextResponse.json({
      data: itemsWithNames,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error('[B2B] GET /activities error', error);
    return NextResponse.json({ error: 'ไม่สามารถดึงรายการกิจกรรมได้' }, { status: 500 });
  }
}

// POST: create activity
export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const body = await request.json();
    const parsed = createActivitySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'ข้อมูลไม่ถูกต้อง', details: parsed.error.issues }, { status: 400 });
    }
    const data = parsed.data as any;

    // set ownerId from token if available
    try {
      const authHeader = request.headers.get('authorization');
      const bearer = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : undefined;
      const cookieToken = (await cookies()).get('b2b_token')?.value;
      const token = bearer || cookieToken;
      if (token) {
        const payload: any = jose.decodeJwt(token);
        if (payload?.adminId) data.ownerId = payload.adminId;
      }
    } catch {}

    const item = await Activity.create(data);
    // ถ้ามีผูกกับดีล ให้อัปเดต lastActivityAt ของดีล
    if (item?.dealId) {
      try {
        await Deal.updateOne({ _id: item.dealId }, { $set: { lastActivityAt: new Date() } });
      } catch {}
    }
    return NextResponse.json(item, { status: 201 });
  } catch (error) {
    console.error('[B2B] POST /activities error', error);
    return NextResponse.json({ error: 'ไม่สามารถสร้างกิจกรรมได้' }, { status: 500 });
  }
}
