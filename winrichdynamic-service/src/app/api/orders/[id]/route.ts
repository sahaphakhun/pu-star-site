import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Order from '@/models/Order';

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();
    const resolvedParams = await params;
    const doc = await Order.findById(resolvedParams.id);
    if (!doc) return NextResponse.json({ error: 'ไม่พบคำสั่งซื้อ' }, { status: 404 });
    return NextResponse.json(doc);
  } catch (error) {
    console.error('[B2B] Error fetching order:', error);
    return NextResponse.json({ error: 'เกิดข้อผิดพลาดในการดึงคำสั่งซื้อ' }, { status: 500 });
  }
}


