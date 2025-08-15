import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { unlink } from 'fs/promises';
import { join } from 'path';
import { ObjectId } from 'mongodb';

// DELETE /api/admin/images/[id] - ลบภาพ
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // ตรวจสอบสิทธิ์
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;

    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'Invalid image ID' },
        { status: 400 }
      );
    }

    const client = await connectDB();
    const db = client.db();
    const imagesCollection = db.collection('uploaded_images');

    // ดึงข้อมูลภาพ
    const image = await imagesCollection.findOne({ _id: new ObjectId(id) });

    if (!image) {
      return NextResponse.json(
        { error: 'Image not found' },
        { status: 404 }
      );
    }

    // ลบไฟล์จากระบบ
    try {
      const filepath = join(process.cwd(), 'public', 'uploads', 'images', image.filename);
      await unlink(filepath);
    } catch (fileError) {
      console.warn(`File not found or already deleted: ${image.filename}`);
    }

    // ลบข้อมูลจากฐานข้อมูล
    await imagesCollection.deleteOne({ _id: new ObjectId(id) });

    return NextResponse.json({
      success: true,
      message: 'Image deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting image:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
