import { NextRequest, NextResponse } from 'next/server';
import * as jose from 'jose';

export async function middleware(request: NextRequest) {
  const { pathname } = new URL(request.url);
  if (!pathname.startsWith('/adminb2b')) {
    return NextResponse.next();
  }

  // allow login page without token
  if (pathname.startsWith('/adminb2b/login')) {
    return NextResponse.next();
  }

  const token = request.cookies.get('b2b_token')?.value;
  const secret = process.env.JWT_SECRET;

  if (!token || !secret) {
    const url = new URL('/adminb2b/login', request.url);
    return NextResponse.redirect(url);
  }

  try {
    const encoder = new TextEncoder();
    await jose.jwtVerify(token, encoder.encode(secret));
    return NextResponse.next();
  } catch {
    const url = new URL('/adminb2b/login', request.url);
    return NextResponse.redirect(url);
  }
}

export const config = {
  matcher: ['/adminb2b/:path*'],
};


