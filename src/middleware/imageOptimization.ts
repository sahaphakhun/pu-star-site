import { NextRequest, NextResponse } from 'next/server';

export function imageOptimizationMiddleware(request: NextRequest) {
  const url = request.nextUrl.clone();
  
  // ตรวจสอบว่าเป็น request สำหรับ image optimization หรือไม่
  if (url.pathname.startsWith('/_next/image')) {
    const imageUrl = url.searchParams.get('url');
    
    // ถ้าเป็น API images หรือ Cloudinary ให้ bypass Next.js optimization
    if (imageUrl && (imageUrl.includes('/api/images/') || imageUrl.includes('res.cloudinary.com'))) {
      // Redirect ไปยัง original URL
      return NextResponse.redirect(imageUrl);
    }
  }
  
  return null; // ให้ middleware หลักดำเนินการต่อ
}
