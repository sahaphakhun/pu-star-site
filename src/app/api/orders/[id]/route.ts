import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Order from '@/models/Order';
import { sendShippingNotification } from '@/app/notification/sms';
import mongoose from 'mongoose';

export const dynamic = 'force-dynamic';

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await connectDB();
    const orderId = params.id;
    if (!mongoose.isValidObjectId(orderId)) {
      return NextResponse.json({ error: 'รูปแบบ id ไม่ถูกต้อง' }, { status: 400 });
    }

    const body = await request.json();

    const order = await Order.findById(orderId);
    if (!order) {
      return NextResponse.json({ error: 'ไม่พบคำสั่งซื้อ' }, { status: 404 });
    }

    const prevTracking = order.trackingNumber;

    // อัปเดตฟิลด์ที่อนุญาต
    if (body.status) order.status = body.status;
    if (body.trackingNumber) order.trackingNumber = body.trackingNumber;
    if (body.shippingProvider) order.shippingProvider = body.shippingProvider;

    await order.save();

    // หากมีการใส่เลขพัสดุใหม่ ให้ส่ง SMS แจ้งลูกค้า
    if (body.trackingNumber && (!prevTracking || prevTracking !== body.trackingNumber)) {
      try {
        const orderNumber = order._id.toString().slice(-8).toUpperCase();
        await sendShippingNotification(
          order.customerPhone,
          orderNumber,
          order.trackingNumber,
          order.shippingProvider || 'ขนส่ง'
        );
        order.trackingSent = true;
        await order.save();
      } catch (smsErr) {
        console.error('ส่ง SMS แจ้งเตือนเลขพัสดุล้มเหลว:', smsErr);
      }
    }

    return NextResponse.json(order);
  } catch (error) {
    console.error('เกิดข้อผิดพลาดในการอัปเดตคำสั่งซื้อ:', error);
    return NextResponse.json({ error: 'เกิดข้อผิดพลาดในการอัปเดตคำสั่งซื้อ' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await connectDB();
    const orderId = params.id;
    if (!mongoose.isValidObjectId(orderId)) {
      return NextResponse.json({ error: 'id ไม่ถูกต้อง' }, { status: 400 });
    }

    const result = await Order.findByIdAndDelete(orderId);
    if (!result) {
      return NextResponse.json({ error: 'ไม่พบคำสั่งซื้อ' }, { status: 404 });
    }
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('เกิดข้อผิดพลาดในการลบคำสั่งซื้อ:', error);
    return NextResponse.json({ error: 'เกิดข้อผิดพลาดในการลบคำสั่งซื้อ' }, { status: 500 });
  }
} 