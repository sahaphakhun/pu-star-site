import { NextRequest, NextResponse } from 'next/server';
import * as jose from 'jose';
import { cookies } from 'next/headers';
import connectDB from '@/lib/mongodb';
import Lead from '@/models/Lead';
import AssignmentState from '@/models/AssignmentState';
import Admin from '@/models/Admin';
import Role from '@/models/Role';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    // ดึง team/role จาก token ถ้ามี เพื่อใช้ assignment
    let tokenPayload: any = undefined;
    try {
      const authHeader = request.headers.get('authorization');
      const bearer = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : undefined;
      const cookieToken = (await cookies()).get('b2b_token')?.value;
      const token = bearer || cookieToken;
      if (token) tokenPayload = jose.decodeJwt(token);
    } catch {}
    const form = await request.formData();
    const file = form.get('file');
    if (!file || !(file instanceof File)) return NextResponse.json({ error: 'ไม่พบไฟล์' }, { status: 400 });
    const text = await file.text();
    const lines = text.split(/\r?\n/).filter(Boolean);
    // คาดหัวคอลัมน์: name,phone,email,company,source,score
    const [header, ...rows] = lines;
    const inserted: any[] = [];
    for (const line of rows) {
      const [name, phone, email, company, source, scoreStr] = line.split(',');
      if (!name) continue;
      const score = Number(scoreStr || '0') || 0;
      const doc: any = { name: name.trim(), phone: phone?.trim(), email: email?.trim(), company: company?.trim(), source: (source?.trim() as any) || 'other', score };
      if (tokenPayload?.team) doc.team = tokenPayload.team as string;
      const exist = (doc.email && await Lead.findOne({ email: doc.email })) || (doc.phone && await Lead.findOne({ phone: doc.phone }));
      if (exist) continue;
      // ทำ round-robin หากไม่มี ownerId ระบุมาในไฟล์
      if (!doc.ownerId) {
        try {
          const sellerRole = await Role.findOne({ name: 'Seller', isActive: true }).lean();
          if (sellerRole) {
            const teamFilter: any = { role: (sellerRole as any)._id, isActive: true };
            if (doc.team) teamFilter.team = doc.team;
            const sellers = await Admin.find(teamFilter).sort({ _id: 1 }).lean();
            if (sellers.length > 0) {
              const state = await AssignmentState.findOneAndUpdate(
                { scope: 'lead', team: doc.team || undefined, roleName: 'Seller' },
                {},
                { upsert: true, new: true, setDefaultsOnInsert: true }
              );
              let next: any = sellers[0];
              if (state.lastAssignedAdminId) {
                const idx = sellers.findIndex((s) => String(s._id) === String(state.lastAssignedAdminId));
                next = sellers[(idx + 1 + sellers.length) % sellers.length];
              }
              doc.ownerId = String(next._id);
              state.lastAssignedAdminId = String(next._id);
              await state.save();
            }
          }
        } catch (e) {
          console.warn('[B2B] Import lead round-robin skipped:', e);
        }
      }
      inserted.push(await Lead.create(doc));
    }
    return NextResponse.json({ inserted: inserted.length });
  } catch (error) {
    console.error('[B2B] Import leads error', error);
    return NextResponse.json({ error: 'นำเข้าไม่ได้' }, { status: 500 });
  }
}


