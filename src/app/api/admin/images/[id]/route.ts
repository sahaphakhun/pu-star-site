import { NextRequest, NextResponse } from 'next/server';
import { MongoClient, ObjectId } from 'mongodb';
import { verifyToken } from '@/lib/auth';
import { deleteImage } from '@/lib/cloudinary';

// DELETE /api/admin/images/[id] - ลบภาพ
export async function DELETE(
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

    // เชื่อมต่อฐานข้อมูลโดยตรง
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

    // ดึงข้อมูลภาพ
    const image = await imagesCollection.findOne({ _id: new ObjectId(id) });

    if (!image) {
      await client.close();
      return NextResponse.json(
        { error: 'Image not found' },
        { status: 404 }
      );
    }

    // ลบไฟล์จาก Cloudinary
    if (image.publicId) {
      try {
        await deleteImage(image.publicId);
      } catch (cloudinaryError) {
        console.warn(`Failed to delete from Cloudinary: ${image.publicId}`, cloudinaryError);
      }
    }

    // ลบข้อมูลจากฐานข้อมูล
    await imagesCollection.deleteOne({ _id: new ObjectId(id) });

    await client.close();

    return NextResponse.json({
      success: true,
      message: 'Image deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting image:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
