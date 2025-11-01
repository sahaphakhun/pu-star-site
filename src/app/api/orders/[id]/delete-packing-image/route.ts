import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Order from '@/models/Order';
import mongoose from 'mongoose';

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
      // ลบรูปภาพจาก Cloudinary โดยใช้ Upload API
      const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
      const uploadPreset = process.env.CLOUDINARY_UPLOAD_PRESET || 'ml_default';
      
      if (cloudName) {
        // ดึง public_id จาก URL
        const publicId = imageUrl.split('/').pop()?.split('.')[0];
        if (publicId) {
          const deleteFormData = new FormData();
          deleteFormData.append('public_id', `packing-images/${publicId}`);
          deleteFormData.append('upload_preset', uploadPreset);
          
          const deleteResponse = await fetch(
            `https://api.cloudinary.com/v1_1/${cloudName}/image/destroy`,
            {
              method: 'POST',
              body: deleteFormData,
            }
          );
          
          if (!deleteResponse.ok) {
            console.error('Error deleting from Cloudinary:', await deleteResponse.text());
          }
        }
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