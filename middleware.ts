import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

// ใช้ TextEncoder สำหรับ Edge runtime
const encoder = new TextEncoder();

// ตรวจสอบ JWT_SECRET
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  console.error('JWT_SECRET ไม่ได้กำหนดใน environment variables');
  // ใน production ควร throw error
  if (process.env.NODE_ENV === 'production') {
    throw new Error('JWT_SECRET ไม่ได้กำหนดใน environment variables');
  }
}

interface DecodedJwt {
  role?: string;
  [key:string]:any;
}

async function getDecodedToken(request: NextRequest): Promise<DecodedJwt | null> {
  const token = request.cookies.get('token')?.value;
  if (!token) return null;
  
  try {
    if (!JWT_SECRET) {
      console.error('JWT_SECRET ไม่ได้กำหนด');
      return null;
    }
    
    const { payload } = await jwtVerify(token, encoder.encode(JWT_SECRET));
    return payload as DecodedJwt;
  } catch (error) {
    console.error('Error verifying JWT token:', error);
    return null;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ปกป้องเส้นทาง /admin
  if (pathname.startsWith('/admin')) {
    const decoded = await getDecodedToken(request);
    if (!decoded || decoded.role !== 'admin') {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('returnUrl', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // ถ้าผู้ใช้ไป /login แต่ล็อกอินอยู่แล้ว ให้ redirect กลับไปหน้าเดิมหรือ home
  if (pathname === '/login') {
    const decoded = await getDecodedToken(request);
    if (decoded) {
      const returnUrl = request.nextUrl.searchParams.get('returnUrl') || '/';
      return NextResponse.redirect(new URL(returnUrl, request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/login'],
}; 