import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Admin from '@/models/Admin';
import Role from '@/models/Role';
import OTPVerification from '@/models/OTPVerification';
import { verifyOTP } from '@/utils/deesmsx';
import { formatPhoneNumber } from '@/utils/phoneUtils';

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const body = await request.json();
    const { name, phone, email, company, role, otp } = body;

    if (!name || !phone || !email || !otp) {
      return NextResponse.json(
        { success: false, error: 'กรุณากรอกข้อมูลให้ครบถ้วน' },
        { status: 400 }
      );
    }

    // แปลงเบอร์โทรศัพท์
    let formattedPhone: string;
    try {
      formattedPhone = formatPhoneNumber(phone);
    } catch (error) {
      return NextResponse.json(
        { success: false, error: error instanceof Error ? error.message : 'เบอร์โทรศัพท์ไม่ถูกต้อง' },
        { status: 400 }
      );
    }

    // ค้นหาข้อมูล OTP ในฐานข้อมูล
    const otpRecord = await OTPVerification.findOne({ phoneNumber: formattedPhone });

    // ตรวจสอบว่า OTP record มีอยู่จริงหรือไม่
    if (!otpRecord) {
      return NextResponse.json(
        { success: false, error: 'ไม่พบข้อมูล OTP สำหรับเบอร์โทรศัพท์นี้ กรุณาขอรหัส OTP ใหม่' },
        { status: 400 }
      );
    }

    // ตรวจสอบว่า OTP หมดอายุหรือไม่
    if (otpRecord.expiresAt < new Date()) {
      await OTPVerification.deleteOne({ _id: otpRecord._id });
      return NextResponse.json(
        { success: false, error: 'รหัส OTP หมดอายุแล้ว กรุณาขอรหัสใหม่' },
        { status: 400 }
      );
    }

    // ตรวจสอบ OTP ผ่าน DeeSMSx
    try {
      await verifyOTP(otpRecord.token, otp);
    } catch (verifyError) {
      console.error('[B2B] Registration OTP verification error:', verifyError);
      return NextResponse.json(
        { success: false, error: 'รหัส OTP ไม่ถูกต้อง' },
        { status: 400 }
      );
    }

    // ตรวจสอบว่าเบอร์โทรศัพท์หรืออีเมลซ้ำหรือไม่
    const existingAdmin = await Admin.findOne({
      $or: [
        { phone: formattedPhone },
        { email: email.toLowerCase() }
      ]
    });

    if (existingAdmin) {
      return NextResponse.json(
        { success: false, error: 'เบอร์โทรศัพท์หรืออีเมลนี้มีอยู่ในระบบแล้ว' },
        { status: 400 }
      );
    }

    // สร้างหรือค้นหา role
    let userRole = await Role.findOne({ name: role });
    if (!userRole) {
      // สร้าง role ใหม่ถ้าไม่มี
      userRole = new Role({
        name: role,
        description: `Role for ${role}`,
        level: role === 'admin' ? 1 : role === 'manager' ? 2 : 3,
        permissions: []
      });
      await userRole.save();
    }

    // สร้าง admin ใหม่
    const admin = new Admin({
      name: name.trim(),
      phone: formattedPhone,
      email: email.trim().toLowerCase(),
      company: company?.trim() || '',
      role: userRole._id,
      isActive: true
    });

    await admin.save();

    // ลบ OTP record เมื่อยืนยันเสร็จสิ้น
    await OTPVerification.deleteOne({ _id: otpRecord._id });

    console.log(`[B2B] New admin registered: ${admin.name} (${formattedPhone})`);

    return NextResponse.json({
      success: true,
      message: 'สมัครสมาชิกสำเร็จ',
      data: {
        admin: {
          id: admin._id,
          name: admin.name,
          phone: admin.phone,
          email: admin.email,
          company: admin.company,
          role: userRole.name
        }
      }
    });

  } catch (error) {
    console.error('[B2B] Registration OTP verification error:', error);
    
    // Log detailed error for debugging
    if (error instanceof Error) {
      console.error('[B2B] Error message:', error.message);
      console.error('[B2B] Error stack:', error.stack);
    }
    
    return NextResponse.json(
      { success: false, error: 'เกิดข้อผิดพลาดในการยืนยัน OTP' },
      { status: 500 }
    );
  }
}
