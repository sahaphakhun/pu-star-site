import { NextResponse } from 'next/server';
import { sendSMS } from '@/utils/deesmsx';
import connectDB from '@/lib/mongodb';
import { cookies } from 'next/headers';
import * as jose from 'jose';
import Admin from '@/models/Admin';

interface DecodedToken {
  adminId: string;
  phone?: string;
  role?: string;
  roleLevel?: number;
  [key: string]: unknown;
}

// API สำหรับส่ง SMS
export async function POST(req: Request) {
  try {
    // ตรวจสอบการยืนยันตัวตน (เฉพาะ Admin เท่านั้นที่ส่ง SMS ได้)
    const cookieStore = cookies() as any;
    const tokenCookie = cookieStore.get('b2b_token');

    if (!tokenCookie) {
      return NextResponse.json(
        { success: false, message: 'ไม่มีสิทธิ์เข้าถึง' },
        { status: 403 }
      );
    }
    try {
      const secret = process.env.JWT_SECRET;
      if (!secret) {
        return NextResponse.json(
          { success: false, message: 'ระบบยังไม่ตั้งค่า JWT_SECRET' },
          { status: 500 }
        );
      }
      const encoder = new TextEncoder();
      const { payload } = await jose.jwtVerify(tokenCookie.value, encoder.encode(secret));
      const decoded = payload as DecodedToken;
      if (!decoded || !decoded.adminId) {
        return NextResponse.json(
          { success: false, message: 'ไม่มีสิทธิ์เข้าถึง' },
          { status: 403 }
        );
      }

      // ตรวจสอบสิทธิ์จาก payload โดยตรง (สอดคล้องกับระบบ B2B ปัจจุบัน)
      if (!decoded.role || (decoded.role !== 'admin' && decoded.role !== 'superadmin')) {
        return NextResponse.json(
          { success: false, message: 'ไม่มีสิทธิ์เข้าถึง (เฉพาะ Admin เท่านั้น)' },
          { status: 403 }
        );
      }

      // (ออปชัน) ตรวจสอบจากฐานข้อมูลเพิ่ม ถ้าต้องการ
      await connectDB();
      const admin = await Admin.findById(decoded.adminId);
      if (!admin) {
        return NextResponse.json(
          { success: false, message: 'ไม่พบบัญชีผู้ใช้' },
          { status: 403 }
        );
      }
    } catch (_error) {
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
      const admins = await Admin.find({}, 'phoneNumber');
      recipients = admins.map((a: any) => a.phoneNumber).filter(Boolean);
    } else if (targetType === 'admin') {
      const admins = await Admin.find({}, 'phoneNumber');
      recipients = admins.map((a: any) => a.phoneNumber).filter(Boolean);
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
