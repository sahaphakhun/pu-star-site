import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { User } from "@/models/User";
import { connectToDB } from "@/lib/mongodb";

export async function POST(request: NextRequest) {
  try {
    const { username, email, password } = await request.json();
    
    // ตรวจสอบข้อมูลที่ส่งมา
    if (!username || !email || !password) {
      return NextResponse.json(
        { message: "กรุณากรอกข้อมูลให้ครบถ้วน" },
        { status: 400 }
      );
    }
    
    // เชื่อมต่อกับฐานข้อมูล
    await connectToDB();
    
    // ตรวจสอบว่ามีชื่อผู้ใช้หรืออีเมลซ้ำหรือไม่
    const existingUser = await User.findOne({
      $or: [{ username }, { email }],
    });
    
    if (existingUser) {
      if (existingUser.username === username) {
        return NextResponse.json(
          { message: "ชื่อผู้ใช้นี้มีอยู่ในระบบแล้ว" },
          { status: 409 }
        );
      }
      
      if (existingUser.email === email) {
        return NextResponse.json(
          { message: "อีเมลนี้มีอยู่ในระบบแล้ว" },
          { status: 409 }
        );
      }
    }
    
    // เข้ารหัสรหัสผ่าน
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    // สร้างผู้ใช้ใหม่
    const newUser = new User({
      username,
      email,
      password: hashedPassword,
      role: "user", // สร้างเป็น user ปกติเสมอ
    });
    
    await newUser.save();
    
    return NextResponse.json(
      { message: "สมัครสมาชิกสำเร็จ" },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("การลงทะเบียนล้มเหลว:", error);
    return NextResponse.json(
      { message: "เกิดข้อผิดพลาดในการลงทะเบียน" },
      { status: 500 }
    );
  }
} 