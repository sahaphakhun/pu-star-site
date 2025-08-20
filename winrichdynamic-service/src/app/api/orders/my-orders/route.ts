import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Order from '@/models/Order';

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const phone = searchParams.get('phone');
    if (!phone) return NextResponse.json({ error: 'กรุณาระบุหมายเลขโทรศัพท์' }, { status: 400 });
    const orders = await Order.find({ customerPhone: phone }).sort({ createdAt: -1 });
    return NextResponse.json(orders);
  } catch (error) {
    console.error('[B2B] My orders error:', error);
    return NextResponse.json({ error: 'เกิดข้อผิดพลาดในการดึงคำสั่งซื้อของคุณ' }, { status: 500 });
  }
}


