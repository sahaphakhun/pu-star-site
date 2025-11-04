import { NextRequest, NextResponse } from 'next/server';
import { NotificationType } from '@/models/Notification';
import {
  getNotifications,
  markAllAsRead,
  markAsRead,
} from '@/lib/notifications';

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const page = Math.max(parseInt(url.searchParams.get('page') ?? '1', 10), 1);
    const limit = Math.min(parseInt(url.searchParams.get('limit') ?? '20', 10), 50);
    const typeParam = url.searchParams.get('type');
    const isReadParam = url.searchParams.get('isRead');
    const priorityParam = url.searchParams.get('priority');
    const userId = url.searchParams.get('userId') || undefined;

    const isRead = (() => {
      if (isReadParam === 'true') return true;
      if (isReadParam === 'false') return false;
      return undefined;
    })();

    const priority = priorityParam === 'low' || priorityParam === 'medium' || priorityParam === 'high' || priorityParam === 'urgent'
      ? priorityParam
      : undefined;

    const data = await getNotifications({
      userId,
      page,
      limit,
      type: typeParam ? (typeParam as NotificationType) : undefined,
      isRead,
      priority,
    });

    return NextResponse.json(data);
  } catch (error) {
    console.error('[Notifications API] GET Error:', error);
    return NextResponse.json(
      { error: 'ไม่สามารถดึงข้อมูลการแจ้งเตือนได้' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { notificationIds, markAll, userId } = body as {
      notificationIds?: string[];
      markAll?: boolean;
      userId?: string;
    };

    if (markAll) {
      await markAllAsRead(userId);
      return NextResponse.json({ success: true });
    }

    if (Array.isArray(notificationIds) && notificationIds.length) {
      await markAsRead(notificationIds);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json(
      { error: 'ไม่มีรายการการแจ้งเตือนที่ต้องอัปเดต' },
      { status: 400 }
    );
  } catch (error) {
    console.error('[Notifications API] PATCH Error:', error);
    return NextResponse.json(
      { error: 'ไม่สามารถอัปเดตสถานะการแจ้งเตือนได้' },
      { status: 500 }
    );
  }
}
