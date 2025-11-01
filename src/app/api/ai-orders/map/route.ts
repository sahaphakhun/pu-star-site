import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import AIOrder from '@/models/AIOrder';
import Order from '@/models/Order';

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    
    const body = await request.json();
    const { aiOrderId, orderId, mappedBy } = body;
    
    // ตรวจสอบข้อมูลที่จำเป็น
    if (!aiOrderId || !orderId || !mappedBy) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: aiOrderId, orderId, mappedBy' },
        { status: 400 }
      );
    }

    // ตรวจสอบว่า AIOrder และ Order มีอยู่จริง
    const [aiOrder, order] = await Promise.all([
      AIOrder.findById(aiOrderId),
      Order.findById(orderId)
    ]);

    if (!aiOrder) {
      return NextResponse.json(
        { success: false, error: 'AI Order not found' },
        { status: 404 }
      );
    }

    if (!order) {
      return NextResponse.json(
        { success: false, error: 'Order not found' },
        { status: 404 }
      );
    }

    // อัปเดต AIOrder ให้แมพกับ Order
    const updatedAIOrder = await AIOrder.findByIdAndUpdate(
      aiOrderId,
      {
        mappedOrderId: orderId,
        mappedAt: new Date(),
        mappedBy: mappedBy,
        order_status: 'completed'
      },
      { new: true }
    );

    return NextResponse.json({
      success: true,
      data: updatedAIOrder
    });

  } catch (error) {
    console.error('[AI Orders Map API] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await connectDB();
    
    const { searchParams } = request.nextUrl;
    const aiOrderId = searchParams.get('aiOrderId');
    
    if (!aiOrderId) {
      return NextResponse.json(
        { success: false, error: 'Missing aiOrderId parameter' },
        { status: 400 }
      );
    }

    // ยกเลิกการแมพ
    const updatedAIOrder = await AIOrder.findByIdAndUpdate(
      aiOrderId,
      {
        mappedOrderId: null,
        mappedAt: null,
        mappedBy: null,
        order_status: 'draft'
      },
      { new: true }
    );

    if (!updatedAIOrder) {
      return NextResponse.json(
        { success: false, error: 'AI Order not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: updatedAIOrder
    });

  } catch (error) {
    console.error('[AI Orders Map API] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
