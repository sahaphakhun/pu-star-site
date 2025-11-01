// Removed duplicated legacy block; single implementation below

import { NextRequest, NextResponse } from 'next/server';
import * as jose from 'jose';
import { cookies } from 'next/headers';
import connectDB from '@/lib/mongodb';
import Lead from '@/models/Lead';
import { createLeadSchema } from '@/schemas/lead';
import AssignmentState from '@/models/AssignmentState';
import Admin from '@/models/Admin';
import Role from '@/models/Role';

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const url = new URL(request.url);
    const page = Number(url.searchParams.get('page') || '1');
    const limit = Math.min(Number(url.searchParams.get('limit') || '20'), 100);
    const q = url.searchParams.get('q') || '';
    const status = url.searchParams.get('status') || undefined;
    const source = url.searchParams.get('source') || undefined;
    const ownerIdParam = url.searchParams.get('ownerId') || undefined;
    const teamParam = url.searchParams.get('team') || undefined;

    const filter: Record<string, any> = {};
    if (q) filter.$or = [{ name: { $regex: q, $options: 'i' } }, { company: { $regex: q, $options: 'i' } }, { email: { $regex: q, $options: 'i' } }];
    if (status) filter.status = status;
    if (source) filter.source = source;

    try {
      const authHeader = request.headers.get('authorization');
      const bearer = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : undefined;
      const cookieToken = (await cookies()).get('b2b_token')?.value;
      const token = bearer || cookieToken;
      if (token) {
        const payload: any = jose.decodeJwt(token);
        const role = String(payload.role || '').toLowerCase();
        const userTeam = payload.team as string | undefined;
        if (role === 'seller') {
          filter.ownerId = payload.adminId;
          if (userTeam) filter.team = userTeam;
        } else if (role === 'manager') {
          if (userTeam) filter.team = userTeam;
          if (ownerIdParam) filter.ownerId = ownerIdParam;
        } else {
          if (ownerIdParam) filter.ownerId = ownerIdParam;
          if (teamParam) filter.team = teamParam;
        }
      }
    } catch {}

    const total = await Lead.countDocuments(filter);
    const items = await Lead.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean();
    const hasParams = url.searchParams.size > 0;
    if (!hasParams) return NextResponse.json(items);
    return NextResponse.json({ data: items, total, page, limit, totalPages: Math.ceil(total / limit) });
  } catch (error) {
    console.error('[B2B] GET /leads error', error);
    return NextResponse.json({ error: 'ไม่สามารถดึง leads ได้' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const raw = await request.json();
    const parsed = createLeadSchema.safeParse(raw);
    if (!parsed.success) return NextResponse.json({ error: 'ข้อมูลไม่ถูกต้อง', details: parsed.error.issues }, { status: 400 });
    const data = parsed.data as any;
    let tokenPayload: any = undefined;
    try {
      const authHeader = request.headers.get('authorization');
      const bearer = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : undefined;
      const cookieToken = (await cookies()).get('b2b_token')?.value;
      const token = bearer || cookieToken;
      if (token) {
        const payload: any = jose.decodeJwt(token);
        tokenPayload = payload;
        if (payload.adminId) data.ownerId = payload.adminId;
        if (payload.team) data.team = payload.team;
      }
    } catch {}
    // dedupe แบบง่ายด้วย email/phone
    if (data.email) {
      const dup = await Lead.findOne({ email: data.email });
      if (dup) return NextResponse.json({ error: 'มี lead อีเมลนี้แล้ว' }, { status: 409 });
    }
    if (data.phone) {
      const dup = await Lead.findOne({ phone: data.phone });
      if (dup) return NextResponse.json({ error: 'มี lead เบอร์นี้แล้ว' }, { status: 409 });
    }
    // หากไม่ได้ระบุ ownerId ให้ทำ round-robin ตามทีม
    if (!data.ownerId) {
      try {
        const sellerRole = await Role.findOne({ name: 'Seller', isActive: true }).lean();
        if (sellerRole) {
          const teamFilter: any = { role: (sellerRole as any)._id, isActive: true };
          if (data.team) teamFilter.team = data.team;
          const sellers = await Admin.find(teamFilter).sort({ _id: 1 }).lean();
          if (sellers.length > 0) {
            const state = await AssignmentState.findOneAndUpdate(
              { scope: 'lead', team: data.team || undefined, roleName: 'Seller' },
              {},
              { upsert: true, new: true, setDefaultsOnInsert: true }
            );
            let next: any = sellers[0];
            if (state.lastAssignedAdminId) {
              const idx = sellers.findIndex((s) => String(s._id) === String(state.lastAssignedAdminId));
              next = sellers[(idx + 1 + sellers.length) % sellers.length];
            }
            data.ownerId = String(next._id);
            state.lastAssignedAdminId = String(next._id);
            await state.save();
          }
        }
      } catch (e) {
        console.warn('[B2B] Lead round-robin skipped:', e);
      }
    }

    const lead = await Lead.create(data);
    return NextResponse.json(lead, { status: 201 });
  } catch (error) {
    console.error('[B2B] POST /leads error', error);
    return NextResponse.json({ error: 'ไม่สามารถสร้าง lead ได้' }, { status: 500 });
  }
}


