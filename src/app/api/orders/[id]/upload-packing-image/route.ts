import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Order from '@/models/Order';
import mongoose from 'mongoose';

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await connectDB();
    const orderId = params.id;
    
    if (!mongoose.isValidObjectId(orderId)) {
      return NextResponse.json({ error: 'รูปแบบ id ไม่ถูกต้อง' }, { status: 400 });
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return NextResponse.json({ error: 'ไม่พบคำสั่งซื้อ' }, { status: 404 });
    }

    // ตรวจสอบจำนวนรูปที่มีอยู่แล้ว
    const currentImageCount = (order.packingProofs || []).length;
    if (currentImageCount >= 10) {
      return NextResponse.json({ error: 'สามารถอัพโหลดได้สูงสุด 10 รูปต่อออเดอร์' }, { status: 400 });
    }

    const { packingProofs } = await request.json();
    
    if (!packingProofs || !Array.isArray(packingProofs) || packingProofs.length === 0) {
      return NextResponse.json({ error: 'ไม่พบข้อมูลรูปภาพ' }, { status: 400 });
    }

    // ตรวจสอบจำนวนรูปที่จะอัพโหลด
    if (currentImageCount + packingProofs.length > 10) {
      return NextResponse.json({ 
        error: `สามารถอัพโหลดได้อีก ${10 - currentImageCount} รูปเท่านั้น` 
      }, { status: 400 });
    }

    // ตรวจสอบรูปแบบข้อมูล
    for (const proof of packingProofs) {
      if (!proof.url || !proof.type || !proof.addedAt) {
        return NextResponse.json({ 
          error: 'ข้อมูลรูปภาพไม่ครบถ้วน' 
        }, { status: 400 });
      }
    }

    // เพิ่มรูปภาพทั้งหมดลงในออเดอร์
    order.packingProofs = [...(order.packingProofs || []), ...packingProofs];
    await order.save();

    return NextResponse.json({ 
      success: true, 
      uploadedCount: packingProofs.length,
      packingProofs: packingProofs,
      totalImages: order.packingProofs.length
    });

  } catch (error) {
    console.error('เกิดข้อผิดพลาดในการบันทึกรูปภาพ:', error);
    return NextResponse.json({ 
      error: 'เกิดข้อผิดพลาดในการบันทึกรูปภาพ' 
    }, { status: 500 });
  }
} 