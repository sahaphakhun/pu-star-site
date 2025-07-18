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

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
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

    const { imageUrl } = await request.json();
    
    if (!imageUrl) {
      return NextResponse.json({ error: 'ไม่พบ URL ของรูปภาพ' }, { status: 400 });
    }

    // ค้นหารูปภาพในออเดอร์
    const packingProofs = order.packingProofs || [];
    const imageIndex = packingProofs.findIndex(proof => proof.url === imageUrl);
    
    if (imageIndex === -1) {
      return NextResponse.json({ error: 'ไม่พบรูปภาพในออเดอร์นี้' }, { status: 404 });
    }

    try {
      // ลบรูปภาพจาก Cloudinary
      const publicId = imageUrl.split('/').pop()?.split('.')[0];
      if (publicId) {
        await cloudinary.uploader.destroy(`packing-images/${publicId}`);
      }
    } catch (cloudinaryError) {
      console.error('Error deleting from Cloudinary:', cloudinaryError);
      // ไม่ return error เพราะอาจจะลบได้แล้วหรือไม่มีอยู่
    }

    // ลบรูปภาพจากออเดอร์
    order.packingProofs = packingProofs.filter(proof => proof.url !== imageUrl);
    await order.save();

    return NextResponse.json({ 
      success: true, 
      message: 'ลบรูปภาพสำเร็จ',
      remainingImages: order.packingProofs.length
    });

  } catch (error) {
    console.error('เกิดข้อผิดพลาดในการลบรูป:', error);
    return NextResponse.json({ 
      error: 'เกิดข้อผิดพลาดในการลบรูป' 
    }, { status: 500 });
  }
} 