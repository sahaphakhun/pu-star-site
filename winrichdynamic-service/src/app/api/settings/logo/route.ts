import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { Settings } from '@/models/Settings';
import cloudinary from '@/lib/cloudinary';

// GET - ดึงโลโก้ปัจจุบัน
export async function GET() {
  try {
    await connectDB();
    const settings = await Settings.findOne();
    
    return NextResponse.json({
      success: true,
      logoUrl: settings?.logoUrl || null
    });
  } catch (error) {
    console.error('Error fetching logo:', error);
    return NextResponse.json({
      success: false,
      error: 'เกิดข้อผิดพลาดในการดึงโลโก้'
    }, { status: 500 });
  }
}

// POST - อัพโหลดโลโก้ใหม่
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    
    if (!file) {
      return NextResponse.json({
        success: false,
        error: 'กรุณาเลือกไฟล์'
      }, { status: 400 });
    }

    // ตรวจสอบประเภทไฟล์
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/svg+xml'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({
        success: false,
        error: 'ชนิดไฟล์ไม่รองรับ (รองรับ: PNG, JPEG, JPG, WebP, SVG)'
      }, { status: 400 });
    }

    // ตรวจสอบขนาดไฟล์ (5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({
        success: false,
        error: 'ไฟล์ใหญ่เกินไป (สูงสุด 5MB)'
      }, { status: 400 });
    }

    // แปลงไฟล์เป็น Buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // อัพโหลดไปยัง Cloudinary
    const uploadResult = await new Promise<any>((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: 'winrich-logo',
          resource_type: 'image',
          overwrite: true,
          public_id: 'company-logo',
          transformation: [
            { width: 300, height: 300, crop: 'limit' }
          ]
        },
        (error, result) => {
          if (error) return reject(error);
          resolve(result);
        }
      );
      stream.end(buffer);
    });

    // บันทึกลงฐานข้อมูล
    await connectDB();
    await Settings.findOneAndUpdate(
      {},
      { logoUrl: uploadResult.secure_url },
      { upsert: true, new: true }
    );

    return NextResponse.json({
      success: true,
      logoUrl: uploadResult.secure_url,
      message: 'อัพโหลดโลโก้สำเร็จ'
    });

  } catch (error) {
    console.error('Error uploading logo:', error);
    return NextResponse.json({
      success: false,
      error: 'เกิดข้อผิดพลาดในการอัพโหลดโลโก้'
    }, { status: 500 });
  }
}
