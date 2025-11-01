import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Deal from '@/models/Deal';

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const url = new URL(request.url);
    const stageId = url.searchParams.get('stageId') || undefined;
    const filter: Record<string, any> = {};
    if (stageId) filter.stageId = stageId;
    const deals = await Deal.find(filter).limit(2000).lean();
    const header = ['dealId', 'title', 'customerName', 'amount', 'stageName', 'status', 'updatedAt'];
    const rows = deals.map((d: any) => [d._id, d.title, d.customerName || '', d.amount, d.stageName || '', d.status, new Date(d.updatedAt).toISOString()]);
    const csv = [header.join(','), ...rows.map((r) => r.map((v) => typeof v === 'string' && v.includes(',') ? '"' + v.replace(/"/g, '""') + '"' : String(v)).join(','))].join('\n');
    return new NextResponse(csv, { headers: { 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': 'attachment; filename="deals.csv"' } });
  } catch (error) {
    console.error('[B2B] GET /reports/export.csv error', error);
    return NextResponse.json({ error: 'ไม่สามารถส่งออก CSV ได้' }, { status: 500 });
  }
}


