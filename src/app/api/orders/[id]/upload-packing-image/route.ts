import { NextRequest, NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';
import connectDB from '@/lib/mongodb';
import Order from '@/models/Order';
import mongoose from 'mongoose';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

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

    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'ไม่พบไฟล์' }, { status: 400 });
    }

    // เช็คประเภทไฟล์
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: 'ประเภทไฟล์ไม่รองรับ' }, { status: 400 });
    }

    // เช็คขนาดไฟล์ (5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'ขนาดไฟล์ต้องไม่เกิน 5MB' }, { status: 400 });
    }

    // แปลงไฟล์เป็น base64
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64 = buffer.toString('base64');
    const dataURI = `data:${file.type};base64,${base64}`;

    // อัพโหลดไป Cloudinary
    const uploadResult = await cloudinary.uploader.upload(dataURI, {
      folder: 'packing-images',
      resource_type: 'image',
      public_id: `order-${orderId}-${Date.now()}`,
      transformation: [
        { width: 1200, height: 1200, crop: 'limit', quality: 'auto' }
      ]
    });

    // เพิ่มรูปภาพลงในออเดอร์
    const packingProof = {
      url: uploadResult.secure_url,
      type: 'image' as const,
      addedAt: new Date()
    };

    order.packingProofs = [...(order.packingProofs || []), packingProof];
    await order.save();

    return NextResponse.json({ 
      success: true, 
      imageUrl: uploadResult.secure_url,
      packingProof
    });

  } catch (error) {
    console.error('เกิดข้อผิดพลาดในการอัพโหลดรูป:', error);
    return NextResponse.json({ 
      error: 'เกิดข้อผิดพลาดในการอัพโหลดรูป' 
    }, { status: 500 });
  }
} 