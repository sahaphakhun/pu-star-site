import { NextRequest, NextResponse } from 'next/server';
import * as jose from 'jose';

export async function middleware(request: NextRequest) {
  const { pathname } = new URL(request.url);

  const TEMP_DISABLE_AUTH = true;
  if (TEMP_DISABLE_AUTH) {
    return NextResponse.next();
  }
  
  // ตรวจสอบเฉพาะ adminb2b routes และ API routes
  if (!pathname.startsWith('/adminb2b') && !pathname.startsWith('/api/')) {
    return NextResponse.next();
  }

  // อนุญาต health check โดยไม่ต้องตรวจสอบ token
  if (pathname === '/api/ping') {
    return NextResponse.next();
  }

  // อนุญาตหน้า login และ register โดยไม่ต้องตรวจสอบ token
  if (pathname.startsWith('/adminb2b/login') || pathname.startsWith('/adminb2b/register')) {
    return NextResponse.next();
  }

  // อนุญาต API init และ validate-token โดยไม่ต้องตรวจสอบ token
  if (pathname.startsWith('/api/adminb2b/init') || pathname.startsWith('/api/adminb2b/validate-token')) {
    return NextResponse.next();
  }

  // อนุญาต API auth routes และ adminb2b login โดยไม่ต้องตรวจสอบ token
  if (
    pathname.startsWith('/api/auth/') ||
    pathname.startsWith('/api/adminb2b/login') ||
    pathname.startsWith('/api/adminb2b/register') ||
    pathname.startsWith('/api/adminb2b/logout')
  ) {
    return NextResponse.next();
  }

  // ตรวจสอบ token จาก Authorization header สำหรับ API calls
  const authHeader = request.headers.get('authorization');
  let token = null;
  
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.slice(7);
  } else {
    // ตรวจสอบ token จาก cookie สำหรับ page navigation
    token = request.cookies.get('b2b_token')?.value;
  }

  const secret = process.env.JWT_SECRET;

  if (!token || !secret) {
    // ถ้าเป็น API call ให้ส่ง 401
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    // ถ้าเป็น page ให้ redirect ไปหน้า login
    const url = new URL('/adminb2b/login', request.url);
    return NextResponse.redirect(url);
  }

  try {
    const encoder = new TextEncoder();
    const { payload } = await jose.jwtVerify(token, encoder.encode(secret));
    
    // ตรวจสอบว่า token หมดอายุหรือไม่
    const currentTime = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < currentTime) {
      console.log('[B2B] Token expired in middleware');
      
      // ถ้าเป็น API call ให้ส่ง 401
      if (pathname.startsWith('/api/')) {
        return NextResponse.json({ error: 'Token expired' }, { status: 401 });
      }
      // ถ้าเป็น page ให้ redirect ไปหน้า login
      const url = new URL('/adminb2b/login', request.url);
      return NextResponse.redirect(url);
    }

    // ตรวจสอบว่า token มีข้อมูลที่จำเป็นหรือไม่ (ยอมรับเฉพาะ OTP login: adminId + phone + role)
    if (!payload.adminId || !(payload as any).phone || !payload.role) {
      console.log('[B2B] Invalid token payload in middleware');
      
      // ถ้าเป็น API call ให้ส่ง 401
      if (pathname.startsWith('/api/')) {
        return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
      }
      // ถ้าเป็น page ให้ redirect ไปหน้า login
      const url = new URL('/adminb2b/login', request.url);
      return NextResponse.redirect(url);
    }

    console.log(`[B2B] Middleware: Token validated for admin: ${payload.adminId}`);
    return NextResponse.next();
    
  } catch (error) {
    console.error('[B2B] Middleware JWT verification failed:', error);
    
    // ถ้าเป็น API call ให้ส่ง 401
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }
    // ถ้าเป็น page ให้ redirect ไปหน้า login
    const url = new URL('/adminb2b/login', request.url);
    return NextResponse.redirect(url);
  }
}

export const config = {
  matcher: ['/adminb2b/:path*', '/api/:path*'],
};
