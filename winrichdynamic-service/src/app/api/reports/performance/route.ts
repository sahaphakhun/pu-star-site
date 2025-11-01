import { NextRequest, NextResponse } from 'next/server';
import * as jose from 'jose';
import { cookies } from 'next/headers';
import connectDB from '@/lib/mongodb';
import Deal from '@/models/Deal';
import Activity from '@/models/Activity';

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const url = new URL(request.url);
    const start = url.searchParams.get('start');
    const end = url.searchParams.get('end');
    const matchDeals: Record<string, any> = {};
    const matchActivities: Record<string, any> = {};
    const ownerIdParam = url.searchParams.get('ownerId') || undefined;
    const teamParam = url.searchParams.get('team') || undefined;

    if (start || end) {
      const range: any = {};
      if (start) range.$gte = new Date(start);
      if (end) range.$lte = new Date(end);
      matchDeals.createdAt = range;
      matchActivities.createdAt = range;
    }

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
          matchDeals.ownerId = payload.adminId;
          matchActivities.ownerId = payload.adminId;
          if (userTeam) { matchDeals.team = userTeam; matchActivities.team = userTeam; }
        } else if (role === 'manager') {
          if (userTeam) { matchDeals.team = userTeam; matchActivities.team = userTeam; }
          if (ownerIdParam) { matchDeals.ownerId = ownerIdParam; matchActivities.ownerId = ownerIdParam; }
        } else {
          if (teamParam) { matchDeals.team = teamParam; matchActivities.team = teamParam; }
          if (ownerIdParam) { matchDeals.ownerId = ownerIdParam; matchActivities.ownerId = ownerIdParam; }
        }
      }
    } catch {}

    const wonAgg = await (Deal as any).aggregate([
      { $match: { ...matchDeals, status: 'won' } },
      { $group: { _id: '$ownerId', wonAmount: { $sum: '$amount' }, wonCount: { $sum: 1 } } },
    ]);

    const actAgg = await (Activity as any).aggregate([
      { $match: matchActivities },
      { $group: { _id: '$ownerId', activityCount: { $sum: 1 } } },
    ]);

    const map: Record<string, any> = {};
    wonAgg.forEach((w: any) => { map[w._id || 'unknown'] = { ownerId: w._id || 'unknown', wonAmount: w.wonAmount, wonCount: w.wonCount, activityCount: 0 }; });
    actAgg.forEach((a: any) => { const m = map[a._id || 'unknown'] || { ownerId: a._id || 'unknown', wonAmount: 0, wonCount: 0, activityCount: 0 }; m.activityCount = a.activityCount; map[a._id || 'unknown'] = m; });

    return NextResponse.json(Object.values(map));
  } catch (error) {
    console.error('[B2B] GET /reports/performance error', error);
    return NextResponse.json({ error: 'ไม่สามารถดึงรายงานได้' }, { status: 500 });
  }
}


