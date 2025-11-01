import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import CatalogFile from '@/models/CatalogFile';
import { verifyToken } from '@/lib/auth';
import cloudinary from 'cloudinary';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await connectDB();
    const items = await CatalogFile.find().sort({ createdAt: -1 }).lean();
    return NextResponse.json({ success: true, items });
  } catch (error) {
    console.error('GET /api/catalog error', error);
    return NextResponse.json({ success: false, error: 'เกิดข้อผิดพลาด' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const decoded = await verifyToken(request as any);
    if (!decoded || decoded.role !== 'admin') {
      return NextResponse.json({ error: 'ต้องเป็นแอดมิน' }, { status: 403 });
    }

    const form = await request.formData();
    const title = (form.get('title') || '').toString();
    const displayName = (form.get('displayName') || '').toString();
    const category = (form.get('category') || '').toString() || undefined;
    const isImageSet = form.get('isImageSet') === 'true';
    
    if (!title) {
      return NextResponse.json({ error: 'ต้องระบุชื่อไฟล์' }, { status: 400 });
    }

    // อัปโหลดไฟล์เดียว
    if (!isImageSet) {
      const file = form.get('file') as File | null;
      if (!file) {
        return NextResponse.json({ error: 'ต้องเลือกไฟล์' }, { status: 400 });
      }

      const allowed = [
        'application/pdf',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // docx
        'application/msword',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // xlsx
        'application/vnd.ms-excel',
        'image/png',
        'image/jpeg',
        'image/jpg',
        'image/gif',
        'image/webp',
        'application/zip',
      ];
      
      if (!allowed.includes(file.type)) {
        return NextResponse.json({ error: 'ชนิดไฟล์ไม่รองรับ' }, { status: 400 });
      }

      // อัปโหลดขึ้น Cloudinary
      cloudinary.v2.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET,
      });

      const arrayBuf = await file.arrayBuffer();
      const uploadRes = await new Promise<cloudinary.UploadApiResponse>((resolve, reject) => {
        const stream = cloudinary.v2.uploader.upload_stream(
          {
            folder: 'catalog',
            resource_type: file.type.startsWith('image/') ? 'image' : 'raw',
            use_filename: true,
            unique_filename: true,
          },
          (err, result) => {
            if (err || !result) return reject(err);
            resolve(result);
          }
        );
        stream.end(Buffer.from(arrayBuf as ArrayBuffer));
      });

      await connectDB();
      const item = await CatalogFile.create({
        title,
        displayName: displayName || title,
        fileUrl: uploadRes.secure_url,
        fileName: uploadRes.public_id,
        fileType: file.type,
        fileSize: file.size,
        category,
        isImageSet: false,
        imageCount: 1,
      });

      return NextResponse.json({ success: true, item });
    }

    // อัปโหลดชุดรูปภาพ
    const files = form.getAll('files') as File[];
    if (!files || files.length === 0) {
      return NextResponse.json({ error: 'ต้องเลือกรูปภาพอย่างน้อย 1 ไฟล์' }, { status: 400 });
    }

    // ตรวจสอบว่าเป็นรูปภาพทั้งหมด
    const imageTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp'];
    for (const file of files) {
      if (!imageTypes.includes(file.type)) {
        return NextResponse.json({ error: 'ไฟล์ต้องเป็นรูปภาพเท่านั้น' }, { status: 400 });
      }
    }

    // อัปโหลดรูปภาพทั้งหมดขึ้น Cloudinary
    cloudinary.v2.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });

    const uploadPromises = files.map(async (file) => {
      const arrayBuf = await file.arrayBuffer();
      return new Promise<cloudinary.UploadApiResponse>((resolve, reject) => {
        const stream = cloudinary.v2.uploader.upload_stream(
          {
            folder: 'catalog/images',
            resource_type: 'image',
            use_filename: true,
            unique_filename: true,
          },
          (err, result) => {
            if (err || !result) return reject(err);
            resolve(result);
          }
        );
        stream.end(Buffer.from(arrayBuf as ArrayBuffer));
      });
    });

    const uploadResults = await Promise.all(uploadPromises);
    const imageUrls = uploadResults.map(result => result.secure_url);
    const totalSize = files.reduce((sum, file) => sum + file.size, 0);

    await connectDB();
    const item = await CatalogFile.create({
      title,
      displayName: displayName || title,
      fileUrl: imageUrls[0], // ใช้รูปแรกเป็นรูปหลัก
      fileName: uploadResults[0].public_id,
      fileType: 'image/set',
      fileSize: totalSize,
      category,
      isImageSet: true,
      imageUrls,
      imageCount: files.length,
    });

    return NextResponse.json({ success: true, item });
  } catch (error) {
    console.error('POST /api/catalog error', error);
    return NextResponse.json({ success: false, error: 'เกิดข้อผิดพลาด' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const decoded = await verifyToken(request as any);
    if (!decoded || decoded.role !== 'admin') {
      return NextResponse.json({ error: 'ต้องเป็นแอดมิน' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'missing id' }, { status: 400 });

    await connectDB();
    const doc = await CatalogFile.findById(id);
    if (!doc) return NextResponse.json({ error: 'ไม่พบข้อมูล' }, { status: 404 });

    // ลบไฟล์ที่ Cloudinary
    cloudinary.v2.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });

    try {
      if (doc.isImageSet && doc.imageUrls && doc.imageUrls.length > 0) {
        // ลบรูปภาพทั้งหมดในชุด
        for (const imageUrl of doc.imageUrls) {
          const publicId = imageUrl.split('/').pop()?.split('.')[0];
          if (publicId) {
            await cloudinary.v2.uploader.destroy(publicId, { resource_type: 'image' });
          }
        }
      } else {
        // ลบไฟล์เดียว
        await cloudinary.v2.uploader.destroy(doc.fileName, { 
          resource_type: doc.fileType?.startsWith('image/') ? 'image' : 'raw' 
        });
      }
    } catch (e) {
      console.error('Cloudinary destroy error', e);
    }

    await doc.deleteOne();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/catalog error', error);
    return NextResponse.json({ success: false, error: 'เกิดข้อผิดพลาด' }, { status: 500 });
  }
}


