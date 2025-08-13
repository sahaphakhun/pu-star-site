import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Order from '@/models/Order';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

interface Slip2GoResponse {
  success: boolean;
  data?: {
    bank: string;
    amount: number;
    date: string;
    time: string;
    transaction_id: string;
    sender_name: string;
    sender_account: string;
    receiver_name: string;
    receiver_account: string;
    slip_type: string;
    confidence: number;
  };
  error?: string;
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { orderId, slipUrl, verificationType = 'manual' } = await request.json();

    if (!orderId || !slipUrl) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    await connectDB();

    // ตรวจสอบว่าออเดอร์มีอยู่จริง
    const order = await Order.findById(orderId);
    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // ตรวจสอบสลิปด้วย Slip2Go API
    const slip2GoResponse = await verifySlipWithSlip2Go(slipUrl);

    // อัปเดตข้อมูลการตรวจสอบสลิปในออเดอร์
    const verificationData = {
      verified: slip2GoResponse.success,
      verifiedAt: new Date(),
      verificationType,
      verifiedBy: session.user.email,
      slip2GoData: slip2GoResponse.data || null,
      error: slip2GoResponse.error || null,
      confidence: slip2GoResponse.data?.confidence || 0
    };

    await Order.findByIdAndUpdate(orderId, {
      $set: {
        slipVerification: verificationData
      }
    });

    return NextResponse.json({
      success: true,
      verification: verificationData
    });

  } catch (error) {
    console.error('Slip verification error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

async function verifySlipWithSlip2Go(slipUrl: string): Promise<Slip2GoResponse> {
  try {
    const apiSecret = process.env.SLIP2GO_API_SECRET || process.env.SLIP2GO_API_KEY;
    const baseUrl = process.env.SLIP2GO_BASE_URL || 'https://connect.slip2go.com/api';

    if (!apiSecret) {
      throw new Error('Slip2Go API secret not configured');
    }

    // ดาวน์โหลดรูปภาพจาก URL
    const imageResponse = await fetch(slipUrl);
    if (!imageResponse.ok) {
      throw new Error('Failed to download slip image');
    }
    const imageBuffer = await imageResponse.arrayBuffer();

    // สร้าง FormData สำหรับ multipart/form-data
    const formData = new FormData();
    formData.append('file', new Blob([imageBuffer], { type: 'image/jpeg' }), 'slip.jpg');
    formData.append('payload', JSON.stringify({
      // สามารถเพิ่ม options อื่นๆ ได้ตาม Slip2Go API
    }));

    // เรียก Slip2Go API ตามสเปก qr-image
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

// API สำหรับตรวจสอบสลิปหลายรายการพร้อมกัน
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { orderIds } = await request.json();

    if (!Array.isArray(orderIds) || orderIds.length === 0) {
      return NextResponse.json({ error: 'Invalid order IDs' }, { status: 400 });
    }

    await connectDB();

    const results = [];

    for (const orderId of orderIds) {
      try {
        const order = await Order.findById(orderId);
        if (!order || !order.slipUrl) {
          results.push({ orderId, success: false, error: 'Order not found or no slip' });
          continue;
        }

        const slip2GoResponse = await verifySlipWithSlip2Go(order.slipUrl);

        const verificationData = {
          verified: slip2GoResponse.success,
          verifiedAt: new Date(),
          verificationType: 'batch',
          verifiedBy: session.user.email,
          slip2GoData: slip2GoResponse.data || null,
          error: slip2GoResponse.error || null,
          confidence: slip2GoResponse.data?.confidence || 0
        };

        await Order.findByIdAndUpdate(orderId, {
          $set: { slipVerification: verificationData }
        });

        results.push({ orderId, success: true, verification: verificationData });

      } catch (error) {
        results.push({ 
          orderId, 
          success: false, 
          error: error instanceof Error ? error.message : 'Unknown error' 
        });
      }
    }

    return NextResponse.json({ success: true, results });

  } catch (error) {
    console.error('Batch slip verification error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
