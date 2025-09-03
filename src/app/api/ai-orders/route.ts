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

    // Helper function to convert address object to string
    const formatAddress = (addressData: any): string | null => {
      if (!addressData) return null;
      if (typeof addressData === 'string') return addressData;
      if (typeof addressData === 'object') {
        const { line1, district, province, postcode } = addressData;
        const parts = [line1, district, province, postcode].filter(part => part && part !== 'null');
        return parts.length > 0 ? parts.join(', ') : null;
      }
      return null;
    };
    
    // Helper function to ensure valid quantity
    const validateQuantity = (qty: any): number => {
      const parsedQty = parseInt(qty) || 0;
      return parsedQty < 1 ? 1 : parsedQty; // Default to 1 if invalid
    };

    // สร้าง AIOrder ใหม่
    const aiOrder = new AIOrder({
      psid: body.psid,
      order_status: body.order_status || 'draft',
      items: (body.items || []).map((item: any) => ({
        ...item,
        qty: validateQuantity(item.qty)
      })),
      pricing: body.pricing || {
        currency: 'THB',
        subtotal: 0,
        discount: 0,
        shipping_fee: 0,
        total: 0
      },
      customer: body.customer ? {
        name: body.customer.name || null,
        phone: body.customer.phone || null,
        address: formatAddress(body.customer.address)
      } : {
        name: null,
        phone: null,
        address: null
      },
      errorMessages: body.errorMessages || [],
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

export async function PATCH(request: NextRequest) {
  try {
    await connectDB();
    
    const { searchParams } = request.nextUrl;
    const aiOrderId = searchParams.get('id');
    const body = await request.json();
    
    if (!aiOrderId) {
      return NextResponse.json(
        { success: false, error: 'Missing aiOrderId parameter' },
        { status: 400 }
      );
    }

    const updatedAIOrder = await AIOrder.findByIdAndUpdate(
      aiOrderId,
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
