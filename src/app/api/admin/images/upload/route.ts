import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { verifyToken } from '@/lib/auth';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';
import { v4 as uuidv4 } from 'uuid';

// POST /api/admin/images/upload - อัพโหลดภาพ
export async function POST(request: NextRequest) {
  try {
    // ตรวจสอบสิทธิ์
    const authResult = await verifyToken(request);
    if (!authResult || !authResult.valid || authResult.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized - Admin access required' }, { status: 401 });
    }

    const formData = await request.formData();
    const files = formData.getAll('images') as File[];
    const categories = formData.getAll('categories') as string[];

    if (!files || files.length === 0) {
      return NextResponse.json(
        { error: 'No files uploaded' },
        { status: 400 }
      );
    }

    const client = await connectDB();
    const db = client.db();
    const imagesCollection = db.collection('uploaded_images');

    const uploadedImages = [];
    const errors = [];

    // สร้างโฟลเดอร์สำหรับเก็บภาพ
    const uploadDir = join(process.cwd(), 'public', 'uploads', 'images');
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const category = categories[i] || 'others';

      try {
        // ตรวจสอบประเภทไฟล์
        if (!file.type.startsWith('image/')) {
          errors.push(`${file.name}: ไม่ใช่ไฟล์ภาพ`);
          continue;
        }

        // ตรวจสอบขนาดไฟล์ (10MB)
        if (file.size > 10 * 1024 * 1024) {
          errors.push(`${file.name}: ไฟล์ใหญ่เกินไป (สูงสุด 10MB)`);
          continue;
        }

        // สร้างชื่อไฟล์ใหม่
        const fileExtension = file.name.split('.').pop();
        const filename = `${uuidv4()}.${fileExtension}`;
        const filepath = join(uploadDir, filename);

        // บันทึกไฟล์
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        await writeFile(filepath, buffer);

        // สร้าง URL สำหรับเข้าถึงภาพ - ใช้โดเมนของเราเอง
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 
                       'http://localhost:3000';
        
        // ตรวจสอบว่า baseUrl มี protocol หรือไม่
        const imageUrl = baseUrl.startsWith('http') 
          ? `${baseUrl}/uploads/images/${filename}`
          : `https://${baseUrl}/uploads/images/${filename}`;

        // บันทึกข้อมูลลงฐานข้อมูล
        const imageData = {
          filename,
          originalName: file.name,
          url: imageUrl,
          size: file.size,
          mimetype: file.type,
          uploadedBy: authResult.name || authResult.phoneNumber || 'Unknown',
          uploadedAt: new Date(),
          category,
          tags: [],
          isPublic: true // ตั้งค่าให้เป็น public เพื่อให้ Facebook Bot เข้าถึงได้
        };

        const result = await imagesCollection.insertOne(imageData);
        uploadedImages.push({
          _id: result.insertedId,
          ...imageData
        });

      } catch (error) {
        console.error(`Error uploading ${file.name}:`, error);
        errors.push(`${file.name}: เกิดข้อผิดพลาดในการอัพโหลด`);
      }
    }

    return NextResponse.json({
      success: true,
      uploadedCount: uploadedImages.length,
      uploadedImages,
      errors: errors.length > 0 ? errors : undefined
    });

  } catch (error) {
    console.error('Error uploading images:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
