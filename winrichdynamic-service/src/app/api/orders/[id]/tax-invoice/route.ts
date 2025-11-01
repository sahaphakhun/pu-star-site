import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Order from '@/models/Order';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();
    const data = await request.json();
    const resolvedParams = await params;
    const doc = await Order.findByIdAndUpdate(
      resolvedParams.id,
      { $set: { taxInvoice: { requestTaxInvoice: true, ...data } } },
      { new: true }
    );
    if (!doc) return NextResponse.json({ error: 'ไม่พบคำสั่งซื้อ' }, { status: 404 });
    return NextResponse.json(doc);
  } catch (error) {
    console.error('[B2B] Tax invoice error:', error);
    return NextResponse.json({ error: 'บันทึกคำขอใบกำกับไม่สำเร็จ' }, { status: 500 });
  }
}


