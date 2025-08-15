import { NextRequest, NextResponse } from 'next/server';
import { MongoClient } from 'mongodb';
import { verifyToken } from '@/lib/auth';
import { uploadImage } from '@/lib/cloudinary';

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

    // เชื่อมต่อฐานข้อมูล
    const MONGODB_URI = process.env.MONGODB_URI || 
                        process.env.MONGO_URL || 
                        process.env.DATABASE_URL || 
                        process.env.MONGODB_URL;
    
    if (!MONGODB_URI) {
      throw new Error('MongoDB connection string not found');
    }

    const client = new MongoClient(MONGODB_URI);
    await client.connect();
    
    const db = client.db();
    const imagesCollection = db.collection('uploaded_images');

    const uploadedImages = [];
    const errors = [];

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

        // แปลงไฟล์เป็น Buffer
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // อัพโหลดไปยัง Cloudinary
        const cloudinaryResult = await uploadImage(buffer, {
          folder: 'winrich-images',
          tags: [category, 'admin-upload'],
          context: {
            originalName: file.name,
            uploadedBy: authResult.name || authResult.phoneNumber || 'Unknown',
            category: category
          }
        });

        // บันทึกข้อมูลลงฐานข้อมูล
        const imageData = {
          publicId: cloudinaryResult.public_id,
          filename: file.name,
          originalName: file.name,
          url: cloudinaryResult.url,
          secureUrl: cloudinaryResult.secure_url,
          size: cloudinaryResult.bytes,
          mimetype: file.type,
          width: cloudinaryResult.width,
          height: cloudinaryResult.height,
          format: cloudinaryResult.format,
          uploadedBy: authResult.name || authResult.phoneNumber || 'Unknown',
          uploadedAt: new Date(),
          category,
          tags: [category],
          isPublic: true,
          cloudinaryData: cloudinaryResult
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

    await client.close();

    return NextResponse.json({
      success: true,
      uploadedCount: uploadedImages.length,
      uploadedImages,
      errors: errors.length > 0 ? errors : undefined
    });

  } catch (error) {
    console.error('Error uploading images:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
