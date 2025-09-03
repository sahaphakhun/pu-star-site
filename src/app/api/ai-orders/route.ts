import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import AIOrder, { IAIOrder } from '@/models/AIOrder';

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    
    const body = await request.json();
    
    // ตรวจสอบข้อมูลที่จำเป็น
    if (!body.psid || !body.aiResponse || !body.userMessage) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: psid, aiResponse, userMessage' },
        { status: 400 }
      );
    }

    // สร้าง AIOrder ใหม่
    const aiOrder = new AIOrder({
      psid: body.psid,
      order_status: body.order_status || 'draft',
      items: body.items || [],
      pricing: body.pricing || {
        currency: 'THB',
        subtotal: 0,
        discount: 0,
        shipping_fee: 0,
        total: 0
      },
      customer: body.customer || {
        name: null,
        phone: null,
        address: null
      },
      errors: body.errors || [],
      aiResponse: body.aiResponse,
      userMessage: body.userMessage
    });

    const savedOrder = await aiOrder.save();
    
    return NextResponse.json({
      success: true,
      data: savedOrder
    });

  } catch (error) {
    console.error('[AI Orders API] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    const { searchParams } = request.nextUrl;
    const psid = searchParams.get('psid');
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    // สร้าง query
    const query: any = {};
    if (psid) query.psid = psid;
    if (status) query.order_status = status;

    // ดึงข้อมูล
    const [orders, total] = await Promise.all([
      AIOrder.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      AIOrder.countDocuments(query)
    ]);

    return NextResponse.json({
      success: true,
      data: {
        orders,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });

  } catch (error) {
    console.error('[AI Orders API] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
