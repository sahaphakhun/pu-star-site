import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import QuoteRequest from '@/models/QuoteRequest';
import AdminNotification from '@/models/AdminNotification';
import { verifyToken } from '@/lib/auth';
import AdminPhone from '@/models/AdminPhone';
import { sendSMS } from '@/app/notification';

export const dynamic = 'force-dynamic';

// POST: สร้างคำขอใบเสนอราคาใหม่
export async function POST(request: NextRequest) {
  try {
    await connectDB();
    
    // ตรวจสอบการยืนยันตัวตน
    const decodedToken = await verifyToken(request);
    if (!decodedToken) {
      return NextResponse.json({ error: 'ไม่มีสิทธิ์เข้าถึง' }, { status: 401 });
    }

    const data = await request.json();
    
    // Validate required fields
    if (!data.customerName || !data.customerPhone || !data.customerAddress || !data.items || data.items.length === 0) {
      return NextResponse.json(
        { error: 'กรุณากรอกข้อมูลให้ครบถ้วน' },
        { status: 400 }
      );
    }

    // สร้างคำขอใบเสนอราคาใหม่
    const quoteRequest = new QuoteRequest({
      customerName: data.customerName,
      customerPhone: data.customerPhone,
      customerAddress: data.customerAddress,
      items: data.items,
      totalAmount: data.totalAmount,
      taxInvoice: data.taxInvoice,
      userId: decodedToken.userId,
      status: 'pending'
    });

    await quoteRequest.save();

    // ส่ง SMS ยืนยันรับคำขอใบเสนอราคาให้ลูกค้า
    try {
      const shortId = quoteRequest._id.toString().slice(-8).toUpperCase();
      const msg = `รับคำขอใบเสนอราคาแล้ว #${shortId}\nทีมงานจะติดต่อกลับโดยเร็ว ขอบคุณครับ`;
      await sendSMS(quoteRequest.customerPhone, msg);
    } catch (err) {
      console.error('ส่ง SMS ยืนยันรับคำขอใบเสนอราคาล้มเหลว:', err);
    }

    // สร้างการแจ้งเตือนสำหรับแอดมิน
    try {
      await AdminNotification.create({
        type: 'quote_request',
        title: '💼 มีคำขอใบเสนอราคาใหม่',
        message: `ลูกค้า ${data.customerName} (${data.customerPhone}) ขอใบเสนอราคา ยอดรวม ฿${data.totalAmount.toLocaleString()} บาท`,
        relatedId: quoteRequest._id.toString(),
        isGlobal: true,
        readBy: []
      });
    } catch (notificationError) {
      console.error('Error creating quote request notification:', notificationError);
    }

    // แจ้งเตือนแอดมินทุกคนผ่าน SMS
    try {
      const adminList = await AdminPhone.find({}, 'phoneNumber').lean();
      const adminMsg = `มีคำขอใบเสนอราคาใหม่! ลูกค้า: ${data.customerName} ยอดรวม: ฿${data.totalAmount.toLocaleString()} บาท`;
      await Promise.allSettled(adminList.map((a: any) => sendSMS(a.phoneNumber, adminMsg)));
    } catch (err) {
      console.error('ส่ง SMS แจ้งแอดมินล้มเหลว:', err);
    }

    return NextResponse.json(quoteRequest, { status: 201 });
  } catch (error) {
    console.error('Error creating quote request:', error);
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการสร้างคำขอใบเสนอราคา' },
      { status: 500 }
    );
  }
}

// GET: ดึงรายการคำขอใบเสนอราคา (สำหรับแอดมิน)
export async function GET(request: NextRequest) {
  try {
    // ตรวจสอบสิทธิ์แอดมิน
    const decodedToken = await verifyToken(request);
    if (!decodedToken || decodedToken.role !== 'admin') {
      return NextResponse.json({ error: 'ไม่มีสิทธิ์เข้าถึง' }, { status: 403 });
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '50');
    const skip = parseInt(searchParams.get('skip') || '0');

    let query: any = {};
    if (status && status !== 'all') {
      query.status = status;
    }

    const quoteRequests = await QuoteRequest.find(query)
      .sort({ requestDate: -1 })
      .limit(limit)
      .skip(skip)
      .populate('quotedBy', 'name')
      .lean();

    const total = await QuoteRequest.countDocuments(query);

    return NextResponse.json({
      success: true,
      data: quoteRequests,
      total,
      hasMore: skip + limit < total
    });

  } catch (error) {
    console.error('Error fetching quote requests:', error);
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการดึงข้อมูลคำขอใบเสนอราคา' },
      { status: 500 }
    );
  }
} 