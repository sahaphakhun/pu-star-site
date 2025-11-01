import { NextRequest, NextResponse } from 'next/server';
import { MongoClient } from 'mongodb';
import { verifyToken } from '@/lib/auth';

// GET /api/admin/images - ดึงรายการภาพทั้งหมด
export async function GET(request: NextRequest) {
  try {
    // ตรวจสอบสิทธิ์
    const authResult = await verifyToken(request);
    if (!authResult || !authResult.valid || authResult.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized - Admin access required' }, { status: 401 });
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

    // ดึงรายการภาพทั้งหมด เรียงตามวันที่อัพโหลดล่าสุด
    const images = await imagesCollection
      .find({})
      .sort({ uploadedAt: -1 })
      .toArray();

    await client.close();

    return NextResponse.json({
      success: true,
      images: images,
      total: images.length
    });

  } catch (error) {
    console.error('Error fetching images:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
