import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import AIOrder from '@/models/AIOrder';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();
    
    const body = await request.json();
    const { id } = params;
    
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Missing aiOrderId parameter' },
        { status: 400 }
      );
    }

    const updatedAIOrder = await AIOrder.findByIdAndUpdate(
      id,
      body,
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
    console.error('[AI Orders PATCH API] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}