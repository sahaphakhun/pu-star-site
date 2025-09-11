import { NextRequest, NextResponse } from 'next/server';
import * as jose from 'jose';
import { cookies } from 'next/headers';
import connectDB from '@/lib/mongodb';
import Approval from '@/models/Approval';
import { createApprovalSchema } from '@/schemas/approval';
import Quotation from '@/models/Quotation';

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const url = new URL(request.url);
    const page = Number(url.searchParams.get('page') || '1');
    const limit = Math.min(Number(url.searchParams.get('limit') || '20'), 100);
    const status = url.searchParams.get('status') || undefined;
    const targetType = url.searchParams.get('targetType') || undefined;
    const targetId = url.searchParams.get('targetId') || undefined;

    const filter: Record<string, any> = {};
    if (status) filter.status = status;
    if (targetType) filter.targetType = targetType;
    if (targetId) filter.targetId = targetId;

    // RBAC: seller เห็นเฉพาะของทีมตนเอง, manager เห็นทีมตัวเอง, admin เห็นทั้งหมด
    try {
      const authHeader = request.headers.get('authorization');
      const bearer = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : undefined;
      const cookieToken = (await cookies()).get('b2b_token')?.value;
      const token = bearer || cookieToken;
      if (token) {
        const payload: any = jose.decodeJwt(token);
        const role = String(payload.role || '').toLowerCase();
        const userTeam = payload.team as string | undefined;
        if (role === 'seller' || role === 'manager') {
          if (userTeam) filter.team = userTeam;
        }
      }
    } catch {}

    const total = await Approval.countDocuments(filter);
    const items = await Approval.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean();
    const hasParams = url.searchParams.size > 0;
    if (!hasParams) return NextResponse.json(items);
    return NextResponse.json({ data: items, total, page, limit, totalPages: Math.ceil(total / limit) });
  } catch (error) {
    console.error('[B2B] GET /approvals error', error);
    return NextResponse.json({ error: 'ไม่สามารถดึงคำขออนุมัติได้' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const body = await request.json();
    const parsed = createApprovalSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: 'ข้อมูลไม่ถูกต้อง', details: parsed.error.issues }, { status: 400 });
    const data = parsed.data as any;

    try {
      const authHeader = request.headers.get('authorization');
      const bearer = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : undefined;
      const cookieToken = (await cookies()).get('b2b_token')?.value;
      const token = bearer || cookieToken;
      if (token) {
        const payload: any = jose.decodeJwt(token);
        data.requestedBy = payload.adminId;
        data.team = payload.team;
      }
    } catch {}

    const item = await Approval.create(data);
    // ถ้าเป็นคำขอจากใบเสนอราคา ให้ตั้งสถานะใบเสนอราคาเป็น pending ด้วย
    try {
      if (data.targetType === 'quotation') {
        await Quotation.updateOne({ _id: data.targetId }, { $set: { approvalStatus: 'pending', approvalReason: data.reason || '' } });
      }
    } catch {}
    return NextResponse.json(item, { status: 201 });
  } catch (error) {
    console.error('[B2B] POST /approvals error', error);
    return NextResponse.json({ error: 'ไม่สามารถสร้างคำขออนุมัติได้' }, { status: 500 });
  }
}


