import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Order from '@/models/Order';
import { getServerSession } from 'next-auth';
import { authOptions, verifyToken } from '@/lib/auth';

// ฟังก์ชันตรวจสอบสลิปด้วย Slip2Go ตามสเปก slip2go.md
async function verifySlipWithSlip2Go(slipUrl: string) {
  try {
    const apiSecret = process.env.SLIP2GO_API_SECRET || process.env.SLIP2GO_API_KEY;
    const baseUrl = process.env.SLIP2GO_BASE_URL || 'https://connect.slip2go.com/api';

    if (!apiSecret) {
      console.warn('Slip2Go API secret not configured');
      return { success: false, error: 'API secret not configured' };
    }

    // ดาวน์โหลดรูปภาพจาก URL
    const imageResponse = await fetch(slipUrl);
    if (!imageResponse.ok) {
      throw new Error('Failed to download slip image');
    }
    const imageBuffer = await imageResponse.arrayBuffer();

    // สร้าง FormData สำหรับ multipart/form-data ตามสเปก qr-image
    const formData = new FormData();
    formData.append('file', new Blob([imageBuffer], { type: 'image/jpeg' }), 'slip.jpg');
    formData.append('payload', JSON.stringify({
      // สามารถเพิ่ม options อื่นๆ ได้ตาม Slip2Go API
    }));

    // เรียก Slip2Go API: /verify-slip/qr-image/info
    const response = await fetch(`${baseUrl}/verify-slip/qr-image/info`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiSecret}`
        // ไม่ต้องใส่ Content-Type เพราะ FormData จะตั้งให้เอง
      },
      body: formData
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Slip2Go API error: ${response.status} - ${errorText}`);
    }

    const resp = await response.json();

    const code: string | undefined = resp?.code;
    const message: string | undefined = resp?.message;
    const data = resp?.data || {};
    const isSuccess = code === '200000' || code === '200200';

    const dateTime: string = data?.dateTime || '';
    let time = '';
    if (dateTime) {
      try {
        const iso = new Date(dateTime).toISOString();
        time = iso.split('T')[1]?.replace('Z', '') || '';
      } catch {}
    }

    const transformedData = {
      bank: data?.receiver?.bank?.name || '',
      amount: typeof data?.amount === 'number' ? data.amount : 0,
      date: dateTime,
      time,
      transaction_id: data?.transRef || '',
      sender_name: data?.sender?.account?.name || '',
      sender_account: data?.sender?.account?.bank?.account || data?.sender?.account?.proxy?.account || '',
      receiver_name: data?.receiver?.account?.name || '',
      receiver_account: data?.receiver?.account?.bank?.account || data?.receiver?.account?.proxy?.account || '',
      slip_type: 'qr-image',
      confidence: isSuccess ? 100 : 0
    };

    return {
      success: isSuccess,
      data: transformedData,
      error: isSuccess ? undefined : (message || 'Slip verification not valid')
    };

  } catch (error) {
    console.error('Slip2Go API error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    let tokenResult: any = null;
    if (!session?.user) {
      try { tokenResult = await verifyToken(request as any); } catch {}
      if (!tokenResult?.valid) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }

    const body = await request.json();
    const { customerName, customerPhone, customerAddress, items, totalAmount, shippingFee, discount, paymentMethod, slipUrl, taxInvoice, orderedBy } = body;

    await connectDB();

    // ตรวจสอบสลิปอัตโนมัติถ้ามีการอัปโหลดสลิป
    let slipVerification = null;
    if (paymentMethod === 'transfer' && slipUrl) {
      console.log('Auto-verifying slip for new order...');
      const slip2GoResponse = await verifySlipWithSlip2Go(slipUrl);
      
      slipVerification = {
        verified: slip2GoResponse.success,
        verifiedAt: new Date(),
        verificationType: 'automatic',
        verifiedBy: 'system',
        slip2GoData: slip2GoResponse.data || null,
        error: slip2GoResponse.error || null,
        confidence: slip2GoResponse.data?.confidence || 0
      };
    }

    const order = new Order({
      customerName,
      customerPhone,
      customerAddress,
      items,
      totalAmount,
      shippingFee,
      discount: discount || 0,
      paymentMethod,
      slipUrl,
      slipVerification,
      taxInvoice,
      userId: (session?.user?.id) || tokenResult?.userId, // เพิ่ม userId โดยตรง
      orderedBy: orderedBy || {
        userId: (session?.user?.id) || tokenResult?.userId,
        name: (session?.user?.name as any) || tokenResult?.name,
        phone: (session?.user as any)?.email || tokenResult?.phoneNumber
      },
      orderDate: new Date(),
      status: 'pending'
    });

    await order.save();

    return NextResponse.json({ 
      success: true, 
      order,
      slipVerification: slipVerification ? {
        verified: slipVerification.verified,
        confidence: slipVerification.confidence
      } : null
    });

  } catch (error) {
    console.error('Create order error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      let tokenResult: any = null;
      try { tokenResult = await verifyToken(request as any); } catch {}
      if (!tokenResult?.valid) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const customerPhone = searchParams.get('customerPhone');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    let query: any = {};

    if (status && status !== 'all') {
      query.status = status;
    }

    if (customerPhone) {
      query.customerPhone = { $regex: customerPhone, $options: 'i' };
    }

    if (startDate && endDate) {
      query.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const orders = await Order.find(query)
      .sort({ createdAt: -1 })
      .limit(100);

    return NextResponse.json({ orders });

  } catch (error) {
    console.error('Get orders error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 