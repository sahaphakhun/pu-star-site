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
    const file = form.get('file') as File | null;
    const category = (form.get('category') || '').toString() || undefined;
    if (!title || !file) {
      return NextResponse.json({ error: 'ข้อมูลไม่ครบ' }, { status: 400 });
    }

    // อัปโหลดขึ้น Cloudinary (ใช้โฟลเดอร์ catalog)
    cloudinary.v2.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });

    const allowed = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // docx
      'application/msword',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // xlsx
      'application/vnd.ms-excel',
      'image/png',
      'image/jpeg',
      'application/zip',
    ];
    if (!allowed.includes(file.type)) {
      return NextResponse.json({ error: 'ชนิดไฟล์ไม่รองรับ' }, { status: 400 });
    }

    const arrayBuf = await file.arrayBuffer();
    const uploadRes = await new Promise<cloudinary.UploadApiResponse>((resolve, reject) => {
      const stream = cloudinary.v2.uploader.upload_stream(
        {
          folder: 'catalog',
          resource_type: 'raw', // รองรับไฟล์ทั่วไป
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
      fileUrl: uploadRes.secure_url,
      fileName: uploadRes.public_id,
      fileType: file.type,
      fileSize: file.size,
      category,
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

    // ลบไฟล์ที่ Cloudinary ด้วย public_id
    cloudinary.v2.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
    try {
      // public_id เก็บไว้ใน fileName
      await cloudinary.v2.uploader.destroy(doc.fileName, { resource_type: 'raw' });
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


