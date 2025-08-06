import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import AdminNotification from '@/models/AdminNotification';
import { verifyToken } from '@/lib/auth';

// GET: ดึงการแจ้งเตือนสำหรับแอดมิน
export async function GET(request: NextRequest) {
  try {
    const decodedToken = await verifyToken(request);
    if (!decodedToken || decodedToken.role !== 'admin') {
      return NextResponse.json({ error: 'ไม่มีสิทธิ์เข้าถึง' }, { status: 403 });
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const unreadOnly = searchParams.get('unreadOnly') === 'true';
    const adminId = decodedToken.userId;

    let query: any = {};

    // ถ้าต้องการเฉพาะข้อความที่ยังไม่อ่าน
    if (unreadOnly) {
      query['readBy.adminId'] = { $ne: adminId };
    }

    const notifications = await AdminNotification.find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    // เพิ่มข้อมูลว่าแอดมินคนนี้อ่านแล้วหรือยัง
    const notificationsWithReadStatus = notifications.map(notification => ({
      ...notification,
      isRead: notification.readBy.some((read: any) => read.adminId.toString() === adminId)
    }));

    return NextResponse.json({
      success: true,
      notifications: notificationsWithReadStatus
    });

  } catch (error) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการดึงข้อมูลการแจ้งเตือน' },
      { status: 500 }
    );
  }
}

// POST: สร้างการแจ้งเตือนใหม่
export async function POST(request: NextRequest) {
  try {
    const decodedToken = await verifyToken(request);
    if (!decodedToken || decodedToken.role !== 'admin') {
      return NextResponse.json({ error: 'ไม่มีสิทธิ์เข้าถึง' }, { status: 403 });
    }

    await connectDB();

    const body = await request.json();
    const { type, title, message, relatedId, isGlobal = true } = body;

    if (!type || !title || !message) {
      return NextResponse.json(
        { error: 'กรุณาระบุข้อมูลให้ครบถ้วน' },
        { status: 400 }
      );
    }

    const notification = new AdminNotification({
      type,
      title,
      message,
      relatedId,
      isGlobal,
      readBy: [] // เริ่มต้นยังไม่มีใครอ่าน
    });

    await notification.save();

    return NextResponse.json({
      success: true,
      notification
    });

  } catch (error) {
    console.error('Error creating notification:', error);
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการสร้างการแจ้งเตือน' },
      { status: 500 }
    );
  }
} 