import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Order from '@/models/Order';
import mongoose from 'mongoose';
import { verifyToken } from '@/lib/auth';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();
    
    const orderId = params.id;
    
    if (!mongoose.isValidObjectId(orderId)) {
      return NextResponse.json({ error: 'รูปแบบ id ไม่ถูกต้อง' }, { status: 400 });
    }

    const { claimStatus, adminResponse, newOrderStatus } = await request.json();
    
    if (!claimStatus || !['approved', 'rejected'].includes(claimStatus)) {
      return NextResponse.json({ error: 'สถานะการเคลมไม่ถูกต้อง' }, { status: 400 });
    }

    if (!adminResponse || adminResponse.trim() === '') {
      return NextResponse.json({ error: 'กรุณาระบุข้อความตอบกลับ' }, { status: 400 });
    }

    // ตรวจสอบว่าออเดอร์มีอยู่จริง
    const order = await Order.findById(orderId);
    if (!order) {
      return NextResponse.json({ error: 'ไม่พบคำสั่งซื้อ' }, { status: 404 });
    }

    // ตรวจสอบว่าออเดอร์มีการเคลมอยู่หรือไม่
    if (order.status !== 'claimed' || !order.claimInfo || order.claimInfo.claimStatus !== 'pending') {
      return NextResponse.json({ error: 'ออเดอร์นี้ไม่ได้อยู่ในสถานะรอการตอบกลับ' }, { status: 400 });
    }

    // กำหนดสถานะออเดอร์ใหม่
    let finalOrderStatus = order.status;
    if (claimStatus === 'approved') {
      finalOrderStatus = newOrderStatus || 'claim_approved';
    } else if (claimStatus === 'rejected') {
      finalOrderStatus = 'claim_rejected';
    }

    // อัพเดตข้อมูลการเคลม
    const updatedOrder = await Order.findByIdAndUpdate(
      orderId,
      {
        $set: {
          status: finalOrderStatus,
          'claimInfo.claimStatus': claimStatus,
          'claimInfo.adminResponse': adminResponse.trim(),
          'claimInfo.responseDate': new Date()
        }
      },
      { new: true }
    );

    return NextResponse.json({
      success: true,
      message: `${claimStatus === 'approved' ? 'อนุมัติ' : 'ปฏิเสธ'}การเคลมสำเร็จ`,
      order: updatedOrder
    });
    
  } catch (error) {
    console.error('Error processing claim response:', error);
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการตอบกลับการเคลม' },
      { status: 500 }
    );
  }
} 

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // ตรวจสอบสิทธิ์แอดมิน
    const authResult = await verifyToken(request);
    if (!authResult.valid || authResult.decoded?.role !== 'admin') {
      return NextResponse.json({ error: 'ไม่มีสิทธิ์เข้าถึง' }, { status: 403 });
    }

    await connectDB();
    
    const orderId = params.id;
    const body = await request.json();
    const { action, adminResponse } = body; // action: 'approve' | 'reject'
    
    if (!action || !['approve', 'reject'].includes(action)) {
      return NextResponse.json({ error: 'กรุณาระบุการดำเนินการ (approve/reject)' }, { status: 400 });
    }
    
    if (!adminResponse || adminResponse.trim() === '') {
      return NextResponse.json({ error: 'กรุณาระบุข้อความตอบกลับ' }, { status: 400 });
    }
    
    // ตรวจสอบออเดอร์
    const order = await Order.findById(orderId);
    if (!order) {
      return NextResponse.json({ error: 'ไม่พบออเดอร์' }, { status: 404 });
    }
    
    if (!order.claimInfo || !order.claimInfo.claimDate) {
      return NextResponse.json({ error: 'ออเดอร์นี้ยังไม่มีการเคลม' }, { status: 400 });
    }
    
    if (order.claimInfo.claimStatus !== 'pending') {
      return NextResponse.json({ error: 'การเคลมนี้ได้มีการตอบกลับแล้ว' }, { status: 400 });
    }
    
    // กำหนดสถานะใหม่
    const newClaimStatus = action === 'approve' ? 'approved' : 'rejected';
    const newOrderStatus = action === 'approve' ? 'claim_approved' : 'claim_rejected';
    
    // อัพเดตออเดอร์
    const updatedOrder = await Order.findByIdAndUpdate(
      orderId,
      {
        $set: {
          status: newOrderStatus,
          'claimInfo.claimStatus': newClaimStatus,
          'claimInfo.adminResponse': adminResponse.trim(),
          'claimInfo.responseDate': new Date()
        }
      },
      { new: true }
    );
    
    return NextResponse.json({
      success: true,
      message: action === 'approve' ? 'อนุมัติการเคลมสำเร็จ' : 'ปฏิเสธการเคลมสำเร็จ',
      order: updatedOrder
    });
    
  } catch (error) {
    console.error('Error processing claim response:', error);
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการตอบกลับการเคลม' },
      { status: 500 }
    );
  }
} 