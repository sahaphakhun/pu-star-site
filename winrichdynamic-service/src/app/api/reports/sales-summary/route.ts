import { NextRequest, NextResponse } from 'next/server';
import * as jose from 'jose';
import { cookies } from 'next/headers';
import connectDB from '@/lib/mongodb';
import Order from '@/models/Order';

const applyOwnerFilters = async (request: NextRequest, match: Record<string, any>) => {
  const url = new URL(request.url);
  const ownerIdParam = url.searchParams.get('ownerId') || undefined;
  const teamParam = url.searchParams.get('team') || undefined;

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
};

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const url = new URL(request.url);
    const start = url.searchParams.get('start');
    const end = url.searchParams.get('end');
    const groupBy = url.searchParams.get('groupBy') || 'month';

    const match: Record<string, any> = {};
    if (start || end) {
      const range: any = {};
      if (start) range.$gte = new Date(start);
      if (end) range.$lte = new Date(end);
      match.orderDate = range;
    }

    await applyOwnerFilters(request, match);

    const format =
      groupBy === 'year' ? '%Y' : groupBy === 'day' ? '%Y-%m-%d' : '%Y-%m';

    const result = await (Order as any).aggregate([
      { $match: match },
      {
        $group: {
          _id: { $dateToString: { format, date: '$orderDate' } },
          totalAmount: { $sum: '$totalAmount' },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    return NextResponse.json(
      result.map((row: any) => ({
        period: row._id,
        totalAmount: row.totalAmount,
        count: row.count,
      }))
    );
  } catch (error) {
    console.error('[B2B] GET /reports/sales-summary error', error);
    return NextResponse.json({ error: 'Unable to load report' }, { status: 500 });
  }
}
