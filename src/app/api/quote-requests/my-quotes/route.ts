import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { verifyToken } from '@/lib/auth';
import QuoteRequest from '@/models/QuoteRequest';

// GET: ดึงประวัติการขอใบเสนอราคาของลูกค้าที่เข้าสู่ระบบ
export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    // ตรวจสอบการยืนยันตัวตน
    const authResult = await verifyToken(request);
    if (!authResult.valid) {
      return NextResponse.json({ error: 'ไม่มีสิทธิ์เข้าถึง' }, { status: 401 });
    }

    const userId = authResult.decoded?.userId;
    
    if (!userId) {
      return NextResponse.json({ error: 'ไม่พบข้อมูลผู้ใช้' }, { status: 400 });
    }

    // ดึงข้อมูลประวัติการขอใบเสนอราคาของลูกค้าคนนี้
    const quoteRequests = await QuoteRequest.find({ userId })
      .sort({ requestDate: -1 }) // เรียงตามวันที่ขอล่าสุดก่อน
      .lean();

    // ใช้ timezone ของไทยในการแสดงผล
    const formattedQuoteRequests = quoteRequests.map((quote: any) => ({
      ...quote,
      requestDate: new Date(quote.requestDate).toLocaleString('th-TH', { timeZone: 'Asia/Bangkok' }),
      quotedAt: quote.quotedAt ? new Date(quote.quotedAt).toLocaleString('th-TH', { timeZone: 'Asia/Bangkok' }) : undefined
    }));

    return NextResponse.json(formattedQuoteRequests, { status: 200 });
  } catch (error) {
    console.error('Error fetching user quote requests:', error);
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการดึงข้อมูลประวัติการขอใบเสนอราคา' },
      { status: 500 }
    );
  }
} 