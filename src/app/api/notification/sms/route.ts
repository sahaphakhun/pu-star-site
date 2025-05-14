import { NextResponse } from 'next/server';
import { sendSMS } from '@/app/notification';
import connectDB from '@/lib/db';
import { cookies } from "next/headers";
import jwt from 'jsonwebtoken';
import User from '@/models/User';

// API สำหรับส่ง SMS
export async function POST(req: Request) {
  try {
    // ตรวจสอบการยืนยันตัวตน (เฉพาะ Admin เท่านั้นที่ส่ง SMS ได้)
    const cookieStore = cookies();
    const tokenCookie = cookieStore.get('token');
    
    if (!tokenCookie) {
      return NextResponse.json(
        { success: false, message: 'ไม่มีสิทธิ์เข้าถึง' },
        { status: 403 }
      );
    }
    
    try {
      // ตรวจสอบและถอดรหัส token
      const decoded = jwt.verify(
        tokenCookie.value, 
        process.env.JWT_SECRET || 'default_secret_replace_in_production'
      ) as any;
      
      if (!decoded || !decoded.userId) {
        return NextResponse.json(
          { success: false, message: 'ไม่มีสิทธิ์เข้าถึง' },
          { status: 403 }
        );
      }
      
      // เชื่อมต่อกับฐานข้อมูล
      await connectDB();
      
      // ค้นหาข้อมูลผู้ใช้จากฐานข้อมูล
      const user = await User.findById(decoded.userId);
      
      if (!user || user.role !== 'admin') {
        return NextResponse.json(
          { success: false, message: 'ไม่มีสิทธิ์เข้าถึง (เฉพาะ Admin เท่านั้น)' },
          { status: 403 }
        );
      }
    } catch (error) {
      return NextResponse.json(
        { success: false, message: 'ไม่มีสิทธิ์เข้าถึง' },
        { status: 403 }
      );
    }

    // รับข้อมูลจาก request
    const { phoneNumber, message } = await req.json();

    if (!phoneNumber || !message) {
      return NextResponse.json(
        { success: false, message: 'กรุณาระบุเบอร์โทรศัพท์และข้อความ' },
        { status: 400 }
      );
    }

    try {
      // ส่ง SMS
      const response = await sendSMS(phoneNumber, message);

      return NextResponse.json({
        success: true,
        message: 'ส่ง SMS สำเร็จ',
        data: response
      });
    } catch (error: any) {
      console.error('เกิดข้อผิดพลาดในการส่ง SMS:', error);
      return NextResponse.json(
        { success: false, message: `เกิดข้อผิดพลาดในการส่ง SMS: ${error.message}` },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('เกิดข้อผิดพลาดในการส่ง SMS:', error);
    return NextResponse.json(
      { success: false, message: 'เกิดข้อผิดพลาดในการส่ง SMS' },
      { status: 500 }
    );
  }
} 