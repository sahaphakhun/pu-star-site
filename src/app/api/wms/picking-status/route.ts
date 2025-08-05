import { NextRequest, NextResponse } from 'next/server';
import { wmsService } from '@/lib/wms';
import Order from '@/models/Order';
import { connectToDatabase } from '@/lib/mongodb';

export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();
    
    const { orderId, pickingOrderNumber, adminUsername } = await request.json();

    if (!orderId || !pickingOrderNumber || !adminUsername) {
      return NextResponse.json(
        { error: 'Order ID, Picking Order Number และ Admin Username จำเป็นต้องระบุ' },
        { status: 400 }
      );
    }

    // ดึงข้อมูลออเดอร์
    const order = await Order.findById(orderId);
    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    // เรียก WMS API ตรวจสอบสถานะการเก็บสินค้า
    const pickingResult = await wmsService.checkPickingStatus(pickingOrderNumber, adminUsername);

    // อัพเดทข้อมูล WMS ในออเดอร์
    await Order.findByIdAndUpdate(orderId, {
      'wmsData.pickingOrderNumber': pickingOrderNumber,
      'wmsData.pickingStatus': pickingResult.status,
      'wmsData.lastPickingCheck': new Date()
    });

    // ถ้าการเก็บสินค้าเสร็จสมบูรณ์ ให้อัพเดทสถานะออเดอร์
    if (pickingResult.status === 'completed' && order.status === 'confirmed') {
      await Order.findByIdAndUpdate(orderId, {
        status: 'ready'
      });
    }

    return NextResponse.json({
      success: true,
      orderId,
      pickingOrderNumber,
      pickingStatus: pickingResult.status,
      message: pickingResult.message,
      orderStatusUpdated: pickingResult.status === 'completed' && order.status === 'confirmed'
    });

  } catch (error) {
    console.error('WMS Picking Status Check Error:', error);
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการตรวจสอบสถานะการเก็บสินค้า' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();
    
    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get('orderId');

    if (!orderId) {
      return NextResponse.json(
        { error: 'Order ID is required' },
        { status: 400 }
      );
    }

    const order = await Order.findById(orderId).select('wmsData status');
    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      pickingData: {
        pickingOrderNumber: order.wmsData?.pickingOrderNumber,
        pickingStatus: order.wmsData?.pickingStatus || 'pending',
        lastPickingCheck: order.wmsData?.lastPickingCheck
      },
      orderStatus: order.status
    });

  } catch (error) {
    console.error('Get Picking Status Error:', error);
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการดึงข้อมูลสถานะการเก็บสินค้า' },
      { status: 500 }
    );
  }
}