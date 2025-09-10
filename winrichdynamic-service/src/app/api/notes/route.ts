import { NextRequest, NextResponse } from 'next/server';
import * as jose from 'jose';
import { cookies } from 'next/headers';
import connectDB from '@/lib/mongodb';
import Note from '@/models/Note';
import { createNoteSchema } from '@/schemas/note';

// GET: list notes by refs
export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const url = new URL(request.url);
    const page = Number(url.searchParams.get('page') || '1');
    const limit = Math.min(Number(url.searchParams.get('limit') || '20'), 100);
    const filter: Record<string, any> = {};
    const customerId = url.searchParams.get('customerId') || undefined;
    const dealId = url.searchParams.get('dealId') || undefined;
    const quotationId = url.searchParams.get('quotationId') || undefined;
    if (customerId) filter.customerId = customerId;
    if (dealId) filter.dealId = dealId;
    if (quotationId) filter.quotationId = quotationId;
    // RBAC: if seller, restrict by ownerId
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
    const total = await Note.countDocuments(filter);
    const items = await Note.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean();
    const hasParams = url.searchParams.size > 0;
    if (!hasParams) return NextResponse.json(items);
    return NextResponse.json({ data: items, total, page, limit, totalPages: Math.ceil(total / limit) });
  } catch (error) {
    console.error('[B2B] GET /notes error', error);
    return NextResponse.json({ error: 'ไม่สามารถดึงโน้ตได้' }, { status: 500 });
  }
}

// POST: create note
export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const body = await request.json();
    const parsed = createNoteSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'ข้อมูลไม่ถูกต้อง', details: parsed.error.issues }, { status: 400 });
    }
    const data = parsed.data as any;
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
    const item = await Note.create(data);
    return NextResponse.json(item, { status: 201 });
  } catch (error) {
    console.error('[B2B] POST /notes error', error);
    return NextResponse.json({ error: 'ไม่สามารถสร้างโน้ตได้' }, { status: 500 });
  }
}


