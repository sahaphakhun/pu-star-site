import { NextRequest, NextResponse } from 'next/server';
import * as jose from 'jose';
import { cookies } from 'next/headers';
import connectDB from '@/lib/mongodb';
import Customer from '@/models/Customer';

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
        match.assignedTo = payload.adminId;
      } else if (role === 'manager') {
        if (ownerIdParam) match.assignedTo = ownerIdParam;
      } else {
        if (ownerIdParam) match.assignedTo = ownerIdParam;
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
    const customerType = url.searchParams.get('customerType') || undefined;
    const region = url.searchParams.get('region') || undefined;

    const match: Record<string, any> = {};
    if (start || end) {
      const range: any = {};
      if (start) range.$gte = new Date(start);
      if (end) range.$lte = new Date(end);
      match.createdAt = range;
    }
    if (customerType) {
      match.customerType = customerType;
    }
    if (region) {
      match.$or = [{ province: region }, { registeredProvince: region }];
    }

    await applyOwnerFilters(request, match);

    const [total, byType, byProvince] = await Promise.all([
      Customer.countDocuments(match),
      (Customer as any).aggregate([
        { $match: match },
        { $group: { _id: '$customerType', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
      (Customer as any).aggregate([
        { $match: match },
        {
          $addFields: {
            region: { $ifNull: ['$province', '$registeredProvince'] },
          },
        },
        { $group: { _id: '$region', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 20 },
      ]),
    ]);

    return NextResponse.json({ total, byType, byProvince });
  } catch (error) {
    console.error('[B2B] GET /reports/customer-analysis error', error);
    return NextResponse.json({ error: 'Unable to load report' }, { status: 500 });
  }
}
