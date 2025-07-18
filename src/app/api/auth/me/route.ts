import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/models/User';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import AdminPhone from '@/models/AdminPhone';

interface DecodedToken {
  userId: string;
  phoneNumber?: string;
  role?: string;
  [key: string]: unknown;
}

export async function GET() {
  try {
    // ดึงค่า token จาก cookie
    const cookieStore = await cookies();
    const token = cookieStore.get('token');

    if (!token) {
      return NextResponse.json({
        success: false,
        message: 'ไม่พบข้อมูลการเข้าสู่ระบบ',
        isLoggedIn: false,
      });
    }

    try {
      // ถอดรหัส token
      const decoded = jwt.verify(
        token.value,
        process.env.JWT_SECRET || 'default_secret_replace_in_production'
      ) as DecodedToken;

      if (!decoded.userId) {
        return NextResponse.json({
          success: false,
          message: 'ข้อมูลการเข้าสู่ระบบไม่ถูกต้อง',
          isLoggedIn: false,
        });
      }

      // เชื่อมต่อกับฐานข้อมูล
      await connectDB();

      // ดึงข้อมูลผู้ใช้
      const user = await User.findById(decoded.userId);

      if (!user) {
        return NextResponse.json({
          success: false,
          message: 'ไม่พบข้อมูลผู้ใช้',
          isLoggedIn: false,
        });
      }

      // ตรวจสอบว่าเบอร์อยู่ใน admin phone หรือไม่
      const adminPhone = await AdminPhone.findOne({ phoneNumber: user?.phoneNumber });
      if (adminPhone && user && user.role !== 'admin') {
        user.role = 'admin';
        await user.save();
      }

      return NextResponse.json({
        success: true,
        isLoggedIn: true,
        user: {
          _id: user._id,
          name: user.name,
          phoneNumber: user.phoneNumber,
          role: user.role,
          addresses: user.addresses || [],
        },
      });
    } catch (_error) {
      // ถ้ามีข้อผิดพลาดในการถอดรหัส token
      return NextResponse.json({
        success: false,
        message: 'ข้อมูลการเข้าสู่ระบบไม่ถูกต้องหรือหมดอายุ',
        isLoggedIn: false,
      });
    }
  } catch (error) {
    console.error('เกิดข้อผิดพลาดในการตรวจสอบข้อมูลผู้ใช้:', error);
    return NextResponse.json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการตรวจสอบข้อมูลผู้ใช้',
      isLoggedIn: false,
    });
  }
}

// PATCH: เพิ่ม/แก้ไข/ลบ addresses ของ user
export async function PATCH(req: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token');
    if (!token) {
      return NextResponse.json({ success: false, message: 'กรุณาเข้าสู่ระบบ' }, { status: 401 });
    }
    let decoded: any;
    try {
      decoded = jwt.verify(token.value, process.env.JWT_SECRET || 'default_secret_replace_in_production');
    } catch {
      return NextResponse.json({ success: false, message: 'token ไม่ถูกต้อง' }, { status: 401 });
    }
    await connectDB();
    const user = await User.findById(decoded.userId);
    if (!user) {
      return NextResponse.json({ success: false, message: 'ไม่พบผู้ใช้' }, { status: 404 });
    }
    const { action, address, addressId } = await req.json();
    if (action === 'add') {
      // เพิ่มที่อยู่ใหม่
      user.addresses = user.addresses || [];
      if (address.isDefault) {
        user.addresses.forEach((a: any) => (a.isDefault = false));
      }
      user.addresses.push(address);
      await user.save();
      return NextResponse.json({ success: true, addresses: user.addresses });
    } else if (action === 'edit') {
      // แก้ไขที่อยู่เดิม
      user.addresses = (user.addresses || []).map((a: any) => {
        if (a._id?.toString() === addressId || a._id === addressId) {
          if (address.isDefault) {
            user.addresses.forEach((b: any) => (b.isDefault = false));
          }
          return { ...a.toObject?.() || a, ...address };
        }
        return a;
      });
      await user.save();
      return NextResponse.json({ success: true, addresses: user.addresses });
    } else if (action === 'delete') {
      // ลบที่อยู่
      user.addresses = (user.addresses || []).filter((a: any) => (a._id?.toString() || a._id) !== addressId);
      await user.save();
      return NextResponse.json({ success: true, addresses: user.addresses });
    }
    return NextResponse.json({ success: false, message: 'action ไม่ถูกต้อง' }, { status: 400 });
  } catch (error) {
    console.error('เกิดข้อผิดพลาดในการจัดการ addresses:', error);
    return NextResponse.json({ success: false, message: 'เกิดข้อผิดพลาด' }, { status: 500 });
  }
} 