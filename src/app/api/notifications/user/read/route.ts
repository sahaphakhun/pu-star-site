import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { verifyToken } from '@/lib/auth';
import UserNotificationRead from '@/models/UserNotificationRead';

// GET: ดึงรายการ eventId ที่ผู้ใช้คนนี้อ่านแล้ว
export async function GET(request: NextRequest) {
  try {
    const decoded = await verifyToken(request);
    if (!decoded) {
      return NextResponse.json({ success: false, message: 'กรุณาเข้าสู่ระบบ' }, { status: 401 });
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category') as 'orders' | 'quotes' | null;

    const criteria: any = { userId: decoded.userId };
    if (category) criteria.category = category;

    const docs = await UserNotificationRead.find(criteria).select('eventId').lean();
    const eventIds = docs.map((d) => d.eventId);

    return NextResponse.json({ success: true, data: { eventIds } });
  } catch (error) {
    console.error('Error fetching user read notifications:', error);
    return NextResponse.json(
      { success: false, message: 'เกิดข้อผิดพลาดในการดึงข้อมูล' },
      { status: 500 }
    );
  }
}

// POST: ทำเครื่องหมายว่าอ่านแล้ว (รองรับหลายรายการ)
export async function POST(request: NextRequest) {
  try {
    const decoded = await verifyToken(request);
    if (!decoded) {
      return NextResponse.json({ success: false, message: 'กรุณาเข้าสู่ระบบ' }, { status: 401 });
    }

    await connectDB();

    const body = await request.json();
    const eventIds: string[] = Array.isArray(body?.eventIds) ? body.eventIds : [];
    const payloads: Array<{ eventId: string; category?: 'orders' | 'quotes'; sourceId?: string }> =
      Array.isArray(body?.items) ? body.items : [];

    if (eventIds.length === 0 && payloads.length === 0) {
      return NextResponse.json({ success: false, message: 'กรุณาระบุ eventIds หรือ items' }, { status: 400 });
    }

    const docsToUpsert = (payloads.length > 0
      ? payloads.map((p) => ({ eventId: p.eventId, category: p.category, sourceId: p.sourceId }))
      : eventIds.map((id) => ({ eventId: id }))
    ).map((d) => ({ ...d, userId: decoded.userId }));

    // upsert ทีละรายการเพื่อให้ unique index ทำงานและ idempotent
    for (const doc of docsToUpsert) {
      await UserNotificationRead.updateOne(
        { userId: doc.userId, eventId: doc.eventId },
        { $setOnInsert: { ...doc, readAt: new Date() } },
        { upsert: true }
      );
    }

    return NextResponse.json({ success: true, message: 'บันทึกสถานะการอ่านแล้ว' });
  } catch (error) {
    console.error('Error marking notifications as read:', error);
    return NextResponse.json(
      { success: false, message: 'เกิดข้อผิดพลาดในการบันทึกสถานะ' },
      { status: 500 }
    );
  }
}


