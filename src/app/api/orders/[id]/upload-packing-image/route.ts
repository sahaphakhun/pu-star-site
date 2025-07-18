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

    const formData = await request.formData();
    const files = formData.getAll('files') as File[];
    
    if (!files || files.length === 0) {
      return NextResponse.json({ error: 'ไม่พบไฟล์' }, { status: 400 });
    }

    // ตรวจสอบจำนวนรูปที่จะอัพโหลด
    if (currentImageCount + files.length > 10) {
      return NextResponse.json({ 
        error: `สามารถอัพโหลดได้อีก ${10 - currentImageCount} รูปเท่านั้น` 
      }, { status: 400 });
    }

    // เช็คประเภทไฟล์และขนาดไฟล์
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    const maxFileSize = 5 * 1024 * 1024; // 5MB
    
    for (const file of files) {
      if (!allowedTypes.includes(file.type)) {
        return NextResponse.json({ 
          error: `ประเภทไฟล์ไม่รองรับ: ${file.name}` 
        }, { status: 400 });
      }
      
      if (file.size > maxFileSize) {
        return NextResponse.json({ 
          error: `ขนาดไฟล์ต้องไม่เกิน 5MB: ${file.name}` 
        }, { status: 400 });
      }
    }

    // อัพโหลดไฟล์ทั้งหมด
    const uploadedImages = [];
    const newPackingProofs = [];
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const uploadPreset = process.env.CLOUDINARY_UPLOAD_PRESET || 'ml_default';

    if (!cloudName) {
      return NextResponse.json({ 
        error: 'การตั้งค่า Cloudinary ไม่ครบถ้วน' 
      }, { status: 500 });
    }

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      try {
        // สร้าง FormData สำหรับส่งไป Cloudinary
        const cloudinaryFormData = new FormData();
        cloudinaryFormData.append('file', file);
        cloudinaryFormData.append('upload_preset', uploadPreset);
        cloudinaryFormData.append('folder', 'packing-images');
        cloudinaryFormData.append('public_id', `order-${orderId}-${Date.now()}-${i}`);
        cloudinaryFormData.append('transformation', 'w_1200,h_1200,c_limit,q_auto');

        // อัพโหลดไป Cloudinary โดยใช้ Upload API
        const uploadResponse = await fetch(
          `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
          {
            method: 'POST',
            body: cloudinaryFormData,
          }
        );

        if (!uploadResponse.ok) {
          const errorData = await uploadResponse.text();
          console.error(`Cloudinary upload error for file ${file.name}:`, errorData);
          return NextResponse.json({ 
            error: `เกิดข้อผิดพลาดในการอัพโหลด ${file.name}` 
          }, { status: 500 });
        }

        const uploadResult = await uploadResponse.json();

        const packingProof = {
          url: uploadResult.secure_url,
          type: 'image' as const,
          addedAt: new Date()
        };

        uploadedImages.push(uploadResult.secure_url);
        newPackingProofs.push(packingProof);

      } catch (uploadError) {
        console.error(`Error uploading file ${file.name}:`, uploadError);
        return NextResponse.json({ 
          error: `เกิดข้อผิดพลาดในการอัพโหลด ${file.name}` 
        }, { status: 500 });
      }
    }

    // เพิ่มรูปภาพทั้งหมดลงในออเดอร์
    order.packingProofs = [...(order.packingProofs || []), ...newPackingProofs];
    await order.save();

    return NextResponse.json({ 
      success: true, 
      uploadedCount: uploadedImages.length,
      imageUrls: uploadedImages,
      packingProofs: newPackingProofs,
      totalImages: order.packingProofs.length
    });

  } catch (error) {
    console.error('เกิดข้อผิดพลาดในการอัพโหลดรูป:', error);
    return NextResponse.json({ 
      error: 'เกิดข้อผิดพลาดในการอัพโหลดรูป' 
    }, { status: 500 });
  }
} 