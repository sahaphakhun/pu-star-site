import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function GET() {
  try {
    // ตรวจสอบสิทธิ์
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ message: "กรุณาล็อกอินก่อน" }, { status: 401 });
    }
    
    if (session.user.role !== "admin") {
      return NextResponse.json({ message: "ไม่มีสิทธิ์เข้าถึง" }, { status: 403 });
    }

    // เชื่อมต่อกับฐานข้อมูล
    await connectDB();

    // ดึงข้อมูลผู้ใช้ทั้งหมด ยกเว้นรหัสผ่าน
    const users = await User.find().select("-password").sort({ createdAt: -1 });

    return NextResponse.json({ users });
  } catch (error: unknown) {
    console.error("Admin Users API Error:", error);
    const errorMessage = error instanceof Error ? error.message : "เกิดข้อผิดพลาดในการดึงข้อมูลผู้ใช้";
    return NextResponse.json(
      { message: errorMessage },
      { status: 500 }
    );
  }
} 