import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import SiteSetting from '@/models/SiteSetting';
import cloudinary from 'cloudinary';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// GET - ดึงค่าโลโก้ปัจจุบัน
export async function GET() {
  try {
    await connectDB();
    const doc = await SiteSetting.findOne().lean();
    return NextResponse.json({
      success: true,
      data: {
        siteName: doc?.siteName || 'WINRICH DYNAMIC',
        logoUrl: doc?.logoUrl || '/logo.jpg',
      },
    });
  } catch (error) {
    console.error('GET /api/admin/settings/logo error', error);
    return NextResponse.json({ success: false, error: 'เกิดข้อผิดพลาด' }, { status: 500 });
  }
}

// POST - อัพโหลดโลโก้ใหม่ (admin only)
export async function POST(request: NextRequest) {
  try {
    const decoded = await verifyToken(request as any);
    if (!decoded || decoded.role !== 'admin') {
      return NextResponse.json({ error: 'ต้องเป็นแอดมิน' }, { status: 403 });
    }

    const form = await request.formData();
    const file = form.get('file') as File | null;
    const siteName = (form.get('siteName') || '').toString().trim();
    if (!file) return NextResponse.json({ error: 'กรุณาเลือกไฟล์' }, { status: 400 });

    const allowedTypes = ['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: 'ชนิดไฟล์ไม่รองรับ' }, { status: 400 });
    }

    cloudinary.v2.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });

    const arrayBuf = await file.arrayBuffer();
    const uploadRes = await new Promise<cloudinary.UploadApiResponse>((resolve, reject) => {
      const stream = cloudinary.v2.uploader.upload_stream(
        {
          folder: 'site-settings',
          resource_type: 'image',
          use_filename: true,
          unique_filename: true,
          overwrite: true,
          transformation: [
            { fetch_format: 'auto', quality: 'auto' },
          ],
        },
        (err, result) => {
          if (err || !result) return reject(err);
          resolve(result);
        }
      );
      stream.end(Buffer.from(arrayBuf as ArrayBuffer));
    });

    await connectDB();
    const doc = await SiteSetting.findOne();
    if (doc) {
      if (siteName) doc.siteName = siteName;
      doc.logoUrl = uploadRes.secure_url;
      await doc.save();
    } else {
      await SiteSetting.create({
        siteName: siteName || 'WINRICH DYNAMIC',
        logoUrl: uploadRes.secure_url,
      });
    }

    return NextResponse.json({ success: true, data: { logoUrl: uploadRes.secure_url } });
  } catch (error) {
    console.error('POST /api/admin/settings/logo error', error);
    return NextResponse.json({ success: false, error: 'เกิดข้อผิดพลาด' }, { status: 500 });
  }
}


