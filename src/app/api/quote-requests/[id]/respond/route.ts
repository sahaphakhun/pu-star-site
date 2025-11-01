import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import QuoteRequest from '@/models/QuoteRequest';
import { verifyToken } from '@/lib/auth';
import { sendSMS } from '@/app/notification';

export const dynamic = 'force-dynamic';

// POST: แอดมินตอบกลับคำขอใบเสนอราคา
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // ตรวจสอบสิทธิ์แอดมิน
    const decodedToken = await verifyToken(request);
    if (!decodedToken || decodedToken.role !== 'admin') {
      return NextResponse.json({ error: 'ไม่มีสิทธิ์เข้าถึง' }, { status: 403 });
    }

    await connectDB();

    const quoteRequestId = params.id;
    const { quoteMessage, quoteFileUrl } = await request.json();

    if (!quoteMessage) {
      return NextResponse.json(
        { error: 'กรุณาระบุข้อความตอบกลับ' },
        { status: 400 }
      );
    }

    // หาคำขอใบเสนอราคา
    const quoteRequest = await QuoteRequest.findById(quoteRequestId);
    if (!quoteRequest) {
      return NextResponse.json(
        { error: 'ไม่พบคำขอใบเสนอราคา' },
        { status: 404 }
      );
    }

    // อัปเดตสถานะและข้อมูลการตอบกลับ
    quoteRequest.status = 'quoted';
    quoteRequest.quoteMessage = quoteMessage;
    if (quoteFileUrl) {
      quoteRequest.quoteFileUrl = quoteFileUrl;
    }
    quoteRequest.quotedBy = decodedToken.userId;
    quoteRequest.quotedAt = new Date();

    await quoteRequest.save();

    // ส่ง SMS แจ้งลูกค้า
    try {
      let customerMessage = `ได้รับใบเสนอราคาแล้ว\n\n${quoteMessage}`;
      
      if (quoteFileUrl) {
        customerMessage += `\n\nดูไฟล์ใบเสนอราคา: ${quoteFileUrl}`;
      }
      
      customerMessage += '\n\nหากสนใจกรุณาติดต่อกลับมา ขอบคุณครับ';

      await sendSMS(quoteRequest.customerPhone, customerMessage);
    } catch (smsError) {
      console.error('Error sending SMS to customer:', smsError);
      // ไม่ให้ error การส่ง SMS ทำให้การตอบกลับล้มเหลว
    }

    return NextResponse.json({
      success: true,
      message: 'ตอบกลับคำขอใบเสนอราคาสำเร็จ',
      data: quoteRequest
    });

  } catch (error) {
    console.error('Error responding to quote request:', error);
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการตอบกลับคำขอใบเสนอราคา' },
      { status: 500 }
    );
  }
} 