import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// GET /api/admin/images - ดึงรายการภาพทั้งหมด
export async function GET(request: NextRequest) {
  try {
    // ตรวจสอบสิทธิ์
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const client = await connectDB();
    const db = client.db();
    const imagesCollection = db.collection('uploaded_images');

    // ดึงรายการภาพทั้งหมด เรียงตามวันที่อัพโหลดล่าสุด
    const images = await imagesCollection
      .find({})
      .sort({ uploadedAt: -1 })
      .toArray();

    return NextResponse.json({
      success: true,
      images: images,
      total: images.length
    });

  } catch (error) {
    console.error('Error fetching images:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
