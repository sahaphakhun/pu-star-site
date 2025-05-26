import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

// ใช้ TextEncoder สำหรับ Edge runtime
const encoder = new TextEncoder();
const JWT_SECRET = process.env.JWT_SECRET || 'default_secret_replace_in_production';

async function isAuthenticated(request: NextRequest): Promise<boolean> {
  const token = request.cookies.get('token')?.value;
  if (!token) return false;
  try {
    // verify JWT; ใช้ HS256
    await jwtVerify(token, encoder.encode(JWT_SECRET));
    return true;
  } catch {
    return false;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ปกป้องเส้นทาง /admin
  if (pathname.startsWith('/admin')) {
    const auth = await isAuthenticated(request);
    if (!auth) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('returnUrl', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // ถ้าผู้ใช้ไป /login แต่ล็อกอินอยู่แล้ว ให้ redirect กลับไปหน้าเดิมหรือ home
  if (pathname === '/login') {
    const auth = await isAuthenticated(request);
    if (auth) {
      const returnUrl = request.nextUrl.searchParams.get('returnUrl') || '/';
      return NextResponse.redirect(new URL(returnUrl, request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/login'],
}; 