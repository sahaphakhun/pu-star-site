import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";

export async function POST(req: NextRequest) {
  try {
    const { name, email, password } = await req.json();

    // ตรวจสอบข้อมูลที่ส่งมา
    if (!name || !email || !password) {
      return NextResponse.json(
        { message: "กรุณากรอกข้อมูลให้ครบถ้วน" },
        { status: 400 }
      );
    }

    // เชื่อมต่อกับฐานข้อมูล
    await connectDB();

    // ตรวจสอบว่าอีเมลนี้มีในระบบหรือไม่
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json(
        { message: "อีเมลนี้มีในระบบแล้ว" },
        { status: 409 }
      );
    }

    // แฮชรหัสผ่าน
    const hashedPassword = await bcrypt.hash(password, 10);

    // สร้างผู้ใช้ใหม่
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role: "user", // กำหนดสิทธิ์เริ่มต้นเป็น user ปกติ
    });

    // ส่งข้อมูลผู้ใช้กลับ โดยไม่รวมรหัสผ่าน
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: passwordField, ...userWithoutPassword } = user.toObject();

    return NextResponse.json({
      message: "สมัครสมาชิกสำเร็จ",
      user: userWithoutPassword,
    });
  } catch (error: unknown) {
    console.error("Registration Error:", error);
    const errorMessage = error instanceof Error ? error.message : "เกิดข้อผิดพลาดในการสมัครสมาชิก";
    return NextResponse.json(
      { message: errorMessage },
      { status: 500 }
    );
  }
} 