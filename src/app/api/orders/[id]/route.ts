import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Order from '@/models/Order';
import { sendShippingNotification } from '@/app/notification/sms';
import mongoose from 'mongoose';
import AdminPhone from '@/models/AdminPhone';
import { sendSMS } from '@/utils/deesmsx';
import { sendOrderStatusUpdate } from '@/app/notification';

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
    const prevStatus = order.status;

    // อัปเดตฟิลด์ที่อนุญาต
    if (body.status) order.status = body.status;
    if (body.packingProofUrl) {
      const proof = {
        url: body.packingProofUrl as string,
        type: (body.proofType || 'image') as 'image' | 'video',
        addedAt: new Date()
      };
      (order as any).packingProofs = [...(order as any).packingProofs || [], proof];
    }
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

    // หากเพิ่ม packing proof ให้ส่ง SMS ให้ลูกค้า
    if (body.packingProofUrl) {
      try {
        const orderNumber = order._id.toString().slice(-8).toUpperCase();
        const msg = `อัปเดตการแพ็คสินค้า #${orderNumber}\nดูรูป/วิดีโอได้ที่ ${body.packingProofUrl}`;
        await sendSMS(order.customerPhone, msg);
      } catch(err){ console.error('ส่ง SMS แพ็คสินค้า fail', err);}    
    }

    // แจ้งแอดมินถ้ามีการเปลี่ยนสถานะสำคัญ
    if (body.status || body.packingProofUrl) {
      try {
        const adminList = await AdminPhone.find({}, 'phoneNumber').lean();
        const adminMsg = `อัปเดตออเดอร์ #${order._id.toString().slice(-8).toUpperCase()} -> ${body.status || 'เพิ่มหลักฐานแพ็ค'} `;
        await Promise.allSettled(adminList.map((a:any)=> sendSMS(a.phoneNumber, adminMsg)));
      }catch(err){}
    }

    // ถ้าสถานะเปลี่ยน ให้แจ้งลูกค้า
    if (body.status && body.status !== prevStatus) {
      try {
        await sendOrderStatusUpdate(order.customerPhone, order._id.toString().slice(-8).toUpperCase(), body.status);
      } catch (err) {
        console.error('ส่ง SMS อัปเดตสถานะล้มเหลว:', err);
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