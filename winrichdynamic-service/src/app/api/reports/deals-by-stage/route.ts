import { NextRequest, NextResponse } from 'next/server';
import * as jose from 'jose';
import { cookies } from 'next/headers';
import connectDB from '@/lib/mongodb';
import Deal from '@/models/Deal';

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const url = new URL(request.url);
    const teamParam = url.searchParams.get('team') || undefined;
    const ownerIdParam = url.searchParams.get('ownerId') || undefined;
    const match: Record<string, any> = {};

    // RBAC basic
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
          match.ownerId = payload.adminId;
          if (userTeam) match.team = userTeam;
        } else if (role === 'manager') {
          if (userTeam) match.team = userTeam;
          if (ownerIdParam) match.ownerId = ownerIdParam;
        } else {
          if (teamParam) match.team = teamParam;
          if (ownerIdParam) match.ownerId = ownerIdParam;
        }
      }
    } catch {}

    const pipeline = [
      { $match: match },
      {
        $group: {
          _id: '$stageId',
          stageName: { $first: '$stageName' },
          totalAmount: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
      { $sort: { totalAmount: -1 } },
    ];

    const result = await (Deal as any).aggregate(pipeline);
    return NextResponse.json(result);
  } catch (error) {
    console.error('[B2B] GET /reports/deals-by-stage error', error);
    return NextResponse.json({ error: 'ไม่สามารถดึงรายงานได้' }, { status: 500 });
  }
}


