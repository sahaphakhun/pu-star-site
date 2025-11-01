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

// API สำหรับส่งการแจ้งเตือนแบบ Dual (SMS + Messenger)
export async function POST(req: Request) {
  try {
    // ตรวจสอบการยืนยันตัวตน (เฉพาะ Admin เท่านั้นที่ส่งได้)
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
      if (!decoded.role || (decoded.role !== 'admin' && decoded.role !== 'superadmin')) {
        return NextResponse.json(
          { success: false, message: 'ไม่มีสิทธิ์เข้าถึง (เฉพาะ Admin เท่านั้น)' },
          { status: 403 }
        );
      }
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
    const { type, phoneNumber, message, orderNumber, totalAmount, trackingNumber, courier } = await req.json();

    if (!phoneNumber) {
      return NextResponse.json({ success: false, message: 'กรุณาระบุเบอร์โทรศัพท์' }, { status: 400 });
    }

    // บังคับให้เป็น string เสมอเพื่อหลีกเลี่ยง TS union null
    let text: string = '';

    switch (type) {
      case 'order_confirmation':
        if (!orderNumber || totalAmount == null) {
          return NextResponse.json({ success: false, message: 'กรุณาระบุเลขที่ออเดอร์และยอดรวม' }, { status: 400 });
        }
        text = `ขอบคุณที่สั่งซื้อ! ออเดอร์ #${orderNumber} ยอดรวม ${totalAmount} บาท ได้รับการยืนยันแล้ว`;
        break;
      case 'shipping_notification':
        if (!orderNumber || !trackingNumber || !courier) {
          return NextResponse.json({ success: false, message: 'กรุณาระบุเลขที่ออเดอร์ เลขพัสดุ และบริษัทขนส่ง' }, { status: 400 });
        }
        text = `ออเดอร์ #${orderNumber} จัดส่งแล้ว เลขพัสดุ ${trackingNumber} (${courier})`;
        break;
      case 'custom':
      default:
        if (!message) {
          return NextResponse.json({ success: false, message: 'กรุณาระบุข้อความ' }, { status: 400 });
        }
        text = message;
        break;
    }

    // ป้องกันเคสผิดพลาดที่ text กลายเป็นค่าว่างโดยไม่คาดคิด
    if (!text || !text.trim()) {
      return NextResponse.json({ success: false, message: 'ไม่พบข้อความที่จะส่ง' }, { status: 400 });
    }

    await sendSMS(phoneNumber, text);
    return NextResponse.json({ success: true, message: 'ส่งการแจ้งเตือนสำเร็จ' });
  } catch (error) {
    console.error('เกิดข้อผิดพลาดในการส่งการแจ้งเตือนแบบ Dual:', error);
    return NextResponse.json(
      { success: false, message: 'เกิดข้อผิดพลาดในการส่งการแจ้งเตือน' },
      { status: 500 }
    );
  }
}
