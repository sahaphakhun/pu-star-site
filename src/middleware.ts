import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  // เส้นทางสาธารณะที่ไม่ต้องล็อกอิน
  const publicPaths = ["/login", "/register"];
  const isPublicPath = publicPaths.includes(path);

  // เส้นทางที่ต้องมีสิทธิ์ admin เท่านั้น
  const adminPaths = ["/admin"];
  const isAdminPath = adminPaths.some((prefix) => path.startsWith(prefix));

  // ถ้าอยู่ในหน้าล็อกอินหรือสมัครสมาชิก และมีการล็อกอินแล้ว ให้ redirect ไปหน้าหลัก
  if (isPublicPath && token) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  // ถ้าไม่ได้ล็อกอิน และพยายามเข้าถึงหน้าที่ต้องล็อกอิน
  if (!isPublicPath && !token && path !== "/") {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // ถ้าพยายามเข้าถึงหน้า admin แต่ไม่มีสิทธิ์ admin
  if (isAdminPath && token?.role !== "admin") {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

// กำหนดว่าจะเรียกใช้ middleware กับ path ใดบ้าง
export const config = {
  matcher: [
    "/admin/:path*",
    "/profile/:path*",
    "/login",
    "/register",
  ],
}; 