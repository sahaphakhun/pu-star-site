import { NextResponse } from 'next/server';
import { sendDualNotification, sendDualOrderConfirmation, sendDualShippingNotification } from '@/app/notification/dualNotification';
import connectDB from '@/lib/mongodb';
import { cookies } from "next/headers";
import jwt from 'jsonwebtoken';
import Admin from '@/models/Admin';

interface DecodedToken {
  userId: string;
  phoneNumber?: string;
  role?: string;
  [key: string]: unknown;
}

// API สำหรับส่งการแจ้งเตือนแบบ Dual (SMS + Messenger)
export async function POST(req: Request) {
  try {
    // ตรวจสอบการยืนยันตัวตน (เฉพาะ Admin เท่านั้นที่ส่งได้)
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
      const admin = await Admin.findById(decoded.userId);
      
      if (!admin || admin.role !== 'admin') {
        return NextResponse.json(
          { success: false, message: 'ไม่มีสิทธิ์เข้าถึง (เฉพาะ Admin เท่านั้น)' },
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

    let result;

    switch (type) {
      case 'order_confirmation':
        if (!orderNumber || !totalAmount) {
          return NextResponse.json({ success: false, message: 'กรุณาระบุเลขที่ออเดอร์และยอดรวม' }, { status: 400 });
        }
        result = await sendDualOrderConfirmation(phoneNumber, orderNumber, totalAmount);
        break;
      
      case 'shipping_notification':
        if (!orderNumber || !trackingNumber || !courier) {
          return NextResponse.json({ success: false, message: 'กรุณาระบุเลขที่ออเดอร์ เลขพัสดุ และบริษัทขนส่ง' }, { status: 400 });
        }
        result = await sendDualShippingNotification(phoneNumber, orderNumber, trackingNumber, courier);
        break;
      
      case 'custom':
      default:
        if (!message) {
          return NextResponse.json({ success: false, message: 'กรุณาระบุข้อความ' }, { status: 400 });
        }
        result = await sendDualNotification(phoneNumber, message);
        break;
    }

    if (result.success) {
      return NextResponse.json({ 
        success: true, 
        message: 'ส่งการแจ้งเตือนสำเร็จ',
        result 
      });
    } else {
      return NextResponse.json({ 
        success: false, 
        message: 'เกิดข้อผิดพลาดในการส่งการแจ้งเตือน',
        error: result.error 
      }, { status: 500 });
    }
  } catch (error) {
    console.error('เกิดข้อผิดพลาดในการส่งการแจ้งเตือนแบบ Dual:', error);
    return NextResponse.json(
      { success: false, message: 'เกิดข้อผิดพลาดในการส่งการแจ้งเตือน' },
      { status: 500 }
    );
  }
}
