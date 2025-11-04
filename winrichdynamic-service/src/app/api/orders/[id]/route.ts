import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Order from '@/models/Order';
import { sendPaymentStatusChangeNotification } from '@/app/notification/paymentNotifications';

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();
    const resolvedParams = await params;
    const doc = await Order.findById(resolvedParams.id);
    if (!doc) return NextResponse.json({ error: 'ไม่พบคำสั่งซื้อ' }, { status: 404 });
    return NextResponse.json(doc);
  } catch (error) {
    console.error('[B2B] Error fetching order:', error);
    return NextResponse.json({ error: 'เกิดข้อผิดพลาดในการดึงคำสั่งซื้อ' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();
    const resolvedParams = await params;
    const body = await request.json();
    const { action, ...updateData } = body;

    const order = await Order.findById(resolvedParams.id);
    if (!order) {
      return NextResponse.json({ error: 'ไม่พบคำสั่งซื้อ' }, { status: 404 });
    }

    let updatedOrder;

    switch (action) {
      case 'confirm_cod_payment':
        if (order.paymentMethod !== 'cod') {
          return NextResponse.json({ error: 'ออเดอร์นี้ไม่ใช่การชำระเงินแบบ COD' }, { status: 400 });
        }
        
        updatedOrder = await Order.findByIdAndUpdate(
          resolvedParams.id,
          {
            codPaymentStatus: 'collected',
            updatedAt: new Date()
          },
          { new: true }
        );

        // ส่งการแจ้งเตือนการเปลี่ยนแปลงสถานะ
        try {
          await sendPaymentStatusChangeNotification(resolvedParams.id, 'collected');
        } catch (notificationError) {
          console.error('Error sending payment status notification:', notificationError);
        }
        break;

      case 'fail_cod_payment':
        if (order.paymentMethod !== 'cod') {
          return NextResponse.json({ error: 'ออเดอร์นี้ไม่ใช่การชำระเงินแบบ COD' }, { status: 400 });
        }
        
        updatedOrder = await Order.findByIdAndUpdate(
          resolvedParams.id,
          {
            codPaymentStatus: 'failed',
            updatedAt: new Date()
          },
          { new: true }
        );

        // ส่งการแจ้งเตือนการเปลี่ยนแปลงสถานะ
        try {
          await sendPaymentStatusChangeNotification(resolvedParams.id, 'failed');
        } catch (notificationError) {
          console.error('Error sending payment status notification:', notificationError);
        }
        break;

      case 'upload_slip':
        if (order.paymentMethod !== 'transfer') {
          return NextResponse.json({ error: 'ออเดอร์นี้ไม่ใช่การชำระเงินแบบโอนเงิน' }, { status: 400 });
        }

        const { slipUrl } = body;
        if (!slipUrl) {
          return NextResponse.json({ error: 'กรุณาระบุ URL ของสลิป' }, { status: 400 });
        }

        updatedOrder = await Order.findByIdAndUpdate(
          resolvedParams.id,
          {
            slipVerification: {
              ...order.slipVerification,
              slipUrl,
              slipUploadedAt: new Date(),
              verified: false,
              status: 'pending_verification'
            },
            updatedAt: new Date()
          },
          { new: true }
        );
        break;

      case 'verify_slip':
        if (order.paymentMethod !== 'transfer') {
          return NextResponse.json({ error: 'ออเดอร์นี้ไม่ใช่การชำระเงินแบบโอนเงิน' }, { status: 400 });
        }

        const { verified, verificationType = 'manual', verifiedBy } = body;
        
        updatedOrder = await Order.findByIdAndUpdate(
          resolvedParams.id,
          {
            slipVerification: {
              ...order.slipVerification,
              verified,
              verificationType,
              verifiedBy,
              verifiedAt: new Date(),
              status: verified ? 'verified' : 'rejected'
            },
            updatedAt: new Date()
          },
          { new: true }
        );

        // ส่งการแจ้งเตือนการเปลี่ยนแปลงสถานะ
        try {
          await sendPaymentStatusChangeNotification(resolvedParams.id, verified ? 'verified' : 'failed');
        } catch (notificationError) {
          console.error('Error sending payment status notification:', notificationError);
        }
        break;

      case 'set_cod_due_date':
        if (order.paymentMethod !== 'cod') {
          return NextResponse.json({ error: 'ออเดอร์นี้ไม่ใช่การชำระเงินแบบ COD' }, { status: 400 });
        }

        const { codPaymentDueDate } = body;
        if (!codPaymentDueDate) {
          return NextResponse.json({ error: 'กรุณาระบุวันที่ครบกำหนดชำระเงิน' }, { status: 400 });
        }

        updatedOrder = await Order.findByIdAndUpdate(
          resolvedParams.id,
          {
            codPaymentDueDate: new Date(codPaymentDueDate),
            updatedAt: new Date()
          },
          { new: true }
        );
        break;

      default:
        // อัพเดทข้อมูลทั่วไป
        updatedOrder = await Order.findByIdAndUpdate(
          resolvedParams.id,
          { ...updateData, updatedAt: new Date() },
          { new: true }
        );
        break;
    }

    return NextResponse.json(updatedOrder);
  } catch (error) {
    console.error('[B2B] Error updating order:', error);
    return NextResponse.json({ error: 'เกิดข้อผิดพลาดในการอัพเดทคำสั่งซื้อ' }, { status: 500 });
  }
}


