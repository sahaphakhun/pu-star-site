import { NextRequest, NextResponse } from 'next/server';
import * as jose from 'jose';
import { cookies } from 'next/headers';
import connectDB from '@/lib/mongodb';
import Activity from '@/models/Activity';

const applyOwnerFilters = async (request: NextRequest, match: Record<string, any>) => {
  const url = new URL(request.url);
  const ownerIdParam = url.searchParams.get('ownerId') || undefined;

  try {
    const authHeader = request.headers.get('authorization');
    const bearer = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : undefined;
    const cookieToken = (await cookies()).get('b2b_token')?.value;
    const token = bearer || cookieToken;
    if (token) {
      const payload: any = jose.decodeJwt(token);
      const role = String(payload.role || '').toLowerCase();
      if (role === 'seller') {
        match.ownerId = payload.adminId;
      } else if (role === 'manager') {
        if (ownerIdParam) match.ownerId = ownerIdParam;
      } else {
        if (ownerIdParam) match.ownerId = ownerIdParam;
      }
    }
  } catch {}
};

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const url = new URL(request.url);
    const start = url.searchParams.get('start');
    const end = url.searchParams.get('end');
    const activityType = url.searchParams.get('activityType') || undefined;

    const match: Record<string, any> = {};
    if (start || end) {
      const range: any = {};
      if (start) range.$gte = new Date(start);
      if (end) range.$lte = new Date(end);
      match.createdAt = range;
    }
    if (activityType) {
      match.type = activityType;
    }

    await applyOwnerFilters(request, match);

    const [total, byType, byStatus] = await Promise.all([
      Activity.countDocuments(match),
      (Activity as any).aggregate([
        { $match: match },
        { $group: { _id: '$type', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
      (Activity as any).aggregate([
        { $match: match },
        { $group: { _id: '$status', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
    ]);

    return NextResponse.json({ total, byType, byStatus });
  } catch (error) {
    console.error('[B2B] GET /reports/activity-report error', error);
    return NextResponse.json({ error: 'Unable to load report' }, { status: 500 });
  }
}
