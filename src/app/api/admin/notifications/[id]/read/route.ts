import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import AdminNotification from '@/models/AdminNotification';
import { verifyToken } from '@/lib/auth';

// PATCH: ทำเครื่องหมายการแจ้งเตือนว่าอ่านแล้ว
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await verifyToken(request);
    if (!authResult.valid || authResult.decoded?.role !== 'admin') {
      return NextResponse.json({ error: 'ไม่มีสิทธิ์เข้าถึง' }, { status: 403 });
    }

    await connectDB();

    const notificationId = params.id;
    const adminId = authResult.decoded.userId;

    // ตรวจสอบว่าการแจ้งเตือนมีอยู่หรือไม่
    const notification = await AdminNotification.findById(notificationId);
    if (!notification) {
      return NextResponse.json({ error: 'ไม่พบการแจ้งเตือน' }, { status: 404 });
    }

    // ตรวจสอบว่าแอดมินคนนี้อ่านแล้วหรือยัง
    const alreadyRead = notification.readBy.some((read: any) => 
      read.adminId.toString() === adminId
    );

    if (!alreadyRead) {
      // เพิ่มข้อมูลการอ่าน
      await AdminNotification.findByIdAndUpdate(
        notificationId,
        {
          $push: {
            readBy: {
              adminId: adminId,
              readAt: new Date()
            }
          }
        }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'ทำเครื่องหมายอ่านแล้วสำเร็จ'
    });

  } catch (error) {
    console.error('Error marking notification as read:', error);
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการทำเครื่องหมายอ่านแล้ว' },
      { status: 500 }
    );
  }
} 