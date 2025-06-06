import { NextResponse } from 'next/server';
import { sendSMS } from '@/app/notification';
import connectDB from '@/lib/db';
import { cookies } from "next/headers";
import jwt from 'jsonwebtoken';
import User from '@/models/User';
import AdminPhone from '@/models/AdminPhone';

interface DecodedToken {
  userId: string;
  phoneNumber?: string;
  role?: string;
  [key: string]: unknown;
}

// API สำหรับส่ง SMS
export async function POST(req: Request) {
  try {
    // ตรวจสอบการยืนยันตัวตน (เฉพาะ Admin เท่านั้นที่ส่ง SMS ได้)
    const cookieStore = cookies() as any;
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
      ) as DecodedToken;
      
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
    } catch (_error) {
      // Ignore specific error as we just need to know if verification failed
      return NextResponse.json(
        { success: false, message: 'ไม่มีสิทธิ์เข้าถึง' },
        { status: 403 }
      );
    }

    // รับข้อมูลจาก request
    const { targetType = 'all', phoneNumbers = [], message } = await req.json();

    if (!message) {
      return NextResponse.json({ success: false, message: 'กรุณาระบุข้อความ' }, { status: 400 });
    }

    let recipients: string[] = [];

    if (targetType === 'all') {
      const users = await User.find({}, 'phoneNumber');
      recipients = users.map((u: any) => u.phoneNumber);
      const adminPhones = await AdminPhone.find({}, 'phoneNumber');
      recipients = [...recipients, ...adminPhones.map((a:any)=>a.phoneNumber)];
    } else if (targetType === 'admin') {
      const adminPhones = await AdminPhone.find({}, 'phoneNumber');
      recipients = adminPhones.map((a:any)=>a.phoneNumber);
    } else if (targetType === 'custom') {
      if (!phoneNumbers || !Array.isArray(phoneNumbers) || phoneNumbers.length === 0) {
        return NextResponse.json({ success: false, message: 'กรุณาระบุเบอร์โทรศัพท์' }, { status: 400 });
      }
      recipients = phoneNumbers;
    }

    // กำจัดเบอร์ซ้ำ
    recipients = [...new Set(recipients)];

    if (recipients.length === 0) {
      return NextResponse.json({ success: false, message: 'ไม่พบเบอร์โทรศัพท์ผู้รับ' }, { status: 400 });
    }

    const results = await Promise.allSettled(
      recipients.map((phone: string) => sendSMS(phone, message))
    );

    const successCount = results.filter(r => r.status === 'fulfilled').length;
    const failCount = recipients.length - successCount;

    return NextResponse.json({ success: true, message: `ส่งสำเร็จ ${successCount} เบอร์, ล้มเหลว ${failCount} เบอร์`, sent: successCount, failed: failCount });
  } catch (error) {
    console.error('เกิดข้อผิดพลาดในการส่ง SMS:', error);
    return NextResponse.json(
      { success: false, message: 'เกิดข้อผิดพลาดในการส่ง SMS' },
      { status: 500 }
    );
  }
} 