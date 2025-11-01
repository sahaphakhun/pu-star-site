import { NextRequest, NextResponse } from 'next/server';
import { readdir, unlink, stat } from 'fs/promises';
import { join } from 'path';

export async function POST(request: NextRequest) {
  try {
    const uploadDir = join(process.cwd(), 'public', 'images', 'ai-uploads');
    
    // ลบไฟล์ที่เก่ากว่า 24 ชั่วโมง
    const files = await readdir(uploadDir);
    const now = Date.now();
    const oneDayMs = 24 * 60 * 60 * 1000;
    
    let deletedCount = 0;
    
    for (const file of files) {
      const filePath = join(uploadDir, file);
      const stats = await stat(filePath);
      
      if (now - stats.mtime.getTime() > oneDayMs) {
        await unlink(filePath);
        deletedCount++;
        console.log(`[CLEANUP] Deleted old file: ${file}`);
      }
    }
    
    return NextResponse.json({ 
      success: true, 
      deletedCount,
      remainingFiles: files.length - deletedCount
    });
    
  } catch (error) {
    console.error('[CLEANUP] Error cleaning up images:', error);
    return NextResponse.json({ error: 'Cleanup failed' }, { status: 500 });
  }
}
