import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';

// GET /api/admin/images/test - ทดสอบการเชื่อมต่อฐานข้อมูล
export async function GET(request: NextRequest) {
  try {
    console.log('Testing database connection...');
    
    const client = await connectDB();
    console.log('Database connected successfully');
    
    const db = client.db();
    const imagesCollection = db.collection('uploaded_images');
    
    // ทดสอบการนับจำนวนเอกสาร
    const count = await imagesCollection.countDocuments();
    console.log(`Total images in database: ${count}`);
    
    return NextResponse.json({
      success: true,
      message: 'Database connection test successful',
      totalImages: count,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Database connection test failed:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Database connection failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
