import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Order from '@/models/Order';
import { verifyToken } from '@/lib/auth';

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = verifyToken(request);
    if (!auth.valid) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    await connectDB();
    const { status } = await request.json();
    const resolvedParams = await params;
    const doc = await Order.findByIdAndUpdate(resolvedParams.id, { status }, { new: true });
    if (!doc) return NextResponse.json({ error: 'ไม่พบคำสั่งซื้อ' }, { status: 404 });
    return NextResponse.json(doc);
  } catch (error) {
    console.error('[B2B] Error updating order status:', error);
    return NextResponse.json({ error: 'เกิดข้อผิดพลาดในการอัปเดตสถานะ' }, { status: 500 });
  }
}


