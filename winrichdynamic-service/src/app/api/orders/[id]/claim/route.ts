import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Order from '@/models/Order';
import { verifyToken } from '@/lib/auth';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // optional: require auth for claim submission depending on policy
    await connectDB();
    const { claimReason, claimImages = [] } = await request.json();
    const resolvedParams = await params;
    const doc = await Order.findByIdAndUpdate(
      resolvedParams.id,
      {
        $set: {
          'claimInfo.claimDate': new Date(),
          'claimInfo.claimReason': claimReason,
          'claimInfo.claimImages': claimImages,
          'claimInfo.claimStatus': 'pending',
        },
      },
      { new: true }
    );
    if (!doc) return NextResponse.json({ error: 'ไม่พบคำสั่งซื้อ' }, { status: 404 });
    return NextResponse.json(doc);
  } catch (error) {
    console.error('[B2B] Claim create error:', error);
    return NextResponse.json({ error: 'บันทึกคำเคลมไม่สำเร็จ' }, { status: 500 });
  }
}


