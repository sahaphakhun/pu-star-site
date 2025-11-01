import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

export async function POST(request: NextRequest) {
  try {
    const { imageUrl } = await request.json();
    
    if (!imageUrl) {
      return NextResponse.json({ error: 'Image URL is required' }, { status: 400 });
    }

    console.log(`[UPLOAD] Downloading image from: ${imageUrl}`);

    // โหลดภาพจาก URL
    const response = await fetch(imageUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      signal: AbortSignal.timeout(30000) // 30 วินาที
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`);
    }

    // สร้างชื่อไฟล์ที่ไม่ซ้ำกัน
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2, 15);
    const urlParts = new URL(imageUrl);
    const extension = urlParts.pathname.split('.').pop() || 'jpg';
    const filename = `ai-image-${timestamp}-${randomId}.${extension}`;

    // สร้างโฟลเดอร์ถ้ายังไม่มี
    const uploadDir = join(process.cwd(), 'public', 'images', 'ai-uploads');
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }

    // บันทึกไฟล์
    const buffer = await response.arrayBuffer();
    const filePath = join(uploadDir, filename);
    await writeFile(filePath, Buffer.from(buffer));

    // สร้าง URL สำหรับเข้าถึงไฟล์
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://your-domain.com';
    const publicUrl = `${baseUrl}/images/ai-uploads/${filename}`;

    console.log(`[UPLOAD] Image saved successfully: ${publicUrl}`);

    return NextResponse.json({ 
      success: true, 
      localUrl: publicUrl,
      originalUrl: imageUrl,
      filename 
    });

  } catch (error) {
    console.error('[UPLOAD] Error uploading image:', error);
    return NextResponse.json({ 
      error: 'Failed to upload image',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
