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
    const productCategory = url.searchParams.get('productCategory') || undefined;

    const match: Record<string, any> = {};
    if (start || end) {
      const range: any = {};
      if (start) range.$gte = new Date(start);
      if (end) range.$lte = new Date(end);
      match.orderDate = range;
    }

    await applyOwnerFilters(request, match);

    const pipeline: any[] = [
      { $match: match },
      { $unwind: '$items' },
      {
        $addFields: {
          productObjectId: {
            $cond: [
              { $eq: [{ $type: '$items.productId' }, 'objectId'] },
              '$items.productId',
              { $convert: { input: '$items.productId', to: 'objectId', onError: null, onNull: null } },
            ],
          },
        },
      },
      {
        $lookup: {
          from: 'products',
          localField: 'productObjectId',
          foreignField: '_id',
          as: 'productInfo',
        },
      },
      {
        $addFields: {
          productName: {
            $ifNull: ['$items.name', { $arrayElemAt: ['$productInfo.name', 0] }],
          },
          productCategory: {
            $ifNull: [{ $arrayElemAt: ['$productInfo.category', 0] }, 'Uncategorized'],
          },
          itemTotal: {
            $ifNull: [
              '$items.amount',
              { $multiply: ['$items.price', '$items.quantity'] },
            ],
          },
        },
      },
    ];

    if (productCategory) {
      pipeline.push({ $match: { productCategory } });
    }

    pipeline.push(
      {
        $group: {
          _id: '$productName',
          category: { $first: '$productCategory' },
          totalValue: { $sum: '$itemTotal' },
          totalQty: { $sum: '$items.quantity' },
        },
      },
      { $sort: { totalValue: -1 } },
      { $limit: 50 }
    );

    const result = await (Order as any).aggregate(pipeline);
    return NextResponse.json(
      result.map((row: any) => ({
        name: row._id,
        category: row.category,
        totalValue: row.totalValue,
        totalQty: row.totalQty,
      }))
    );
  } catch (error) {
    console.error('[B2B] GET /reports/product-sales error', error);
    return NextResponse.json({ error: 'Unable to load report' }, { status: 500 });
  }
}
