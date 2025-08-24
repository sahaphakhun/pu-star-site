import { NextRequest, NextResponse } from 'next/server';
import * as jose from 'jose';

export async function middleware(request: NextRequest) {
  const { pathname } = new URL(request.url);
  
  // ตรวจสอบเฉพาะ adminb2b routes
  if (!pathname.startsWith('/adminb2b')) {
    return NextResponse.next();
  }

  // อนุญาตหน้า login โดยไม่ต้องตรวจสอบ token
  if (pathname.startsWith('/adminb2b/login')) {
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
    await jose.jwtVerify(token, encoder.encode(secret));
    return NextResponse.next();
  } catch {
    // ถ้าเป็น API call ให้ส่ง 401
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    // ถ้าเป็น page ให้ redirect ไปหน้า login
    const url = new URL('/adminb2b/login', request.url);
    return NextResponse.redirect(url);
  }
}

export const config = {
  matcher: ['/adminb2b/:path*', '/api/:path*'],
};


