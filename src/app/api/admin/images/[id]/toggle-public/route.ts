import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { verifyToken } from '@/lib/auth';
import { ObjectId } from 'mongodb';

// PATCH /api/admin/images/[id]/toggle-public - สลับสถานะ public/private
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // ตรวจสอบสิทธิ์
    const authResult = await verifyToken(request);
    if (!authResult || !authResult.valid || authResult.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized - Admin access required' }, { status: 401 });
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

    // ดึงข้อมูลภาพปัจจุบัน
    const image = await imagesCollection.findOne({ _id: new ObjectId(id) });

    if (!image) {
      return NextResponse.json(
        { error: 'Image not found' },
        { status: 404 }
      );
    }

    // สลับสถานะ
    const newStatus = !image.isPublic;
    await imagesCollection.updateOne(
      { _id: new ObjectId(id) },
      { $set: { isPublic: newStatus } }
    );

    return NextResponse.json({
      success: true,
      message: `Image ${newStatus ? 'public' : 'private'} successfully`,
      isPublic: newStatus
    });

  } catch (error) {
    console.error('Error toggling image public status:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
