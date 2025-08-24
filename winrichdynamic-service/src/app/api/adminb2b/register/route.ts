import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Admin from '@/models/Admin';
import Role from '@/models/Role';
import { formatPhoneNumber, isValidPhoneNumber } from '@/utils/phoneUtils';

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const body = await request.json();
    const { name, phone, email, company, role } = body;

    // ตรวจสอบข้อมูลที่จำเป็น
    if (!name || !phone || !email) {
      return NextResponse.json(
        { success: false, error: 'กรุณากรอกข้อมูลให้ครบถ้วน' },
        { status: 400 }
      );
    }

    // ตรวจสอบและแปลงเบอร์โทรศัพท์
    if (!isValidPhoneNumber(phone)) {
      return NextResponse.json(
        { success: false, error: 'เบอร์โทรศัพท์ไม่ถูกต้อง กรุณากรอก 9-10 หลัก' },
        { status: 400 }
      );
    }

    let formattedPhone: string;
    try {
      formattedPhone = formatPhoneNumber(phone);
    } catch (error) {
      return NextResponse.json(
        { success: false, error: error instanceof Error ? error.message : 'เบอร์โทรศัพท์ไม่ถูกต้อง' },
        { status: 400 }
      );
    }

    // ตรวจสอบอีเมล
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, error: 'รูปแบบอีเมลไม่ถูกต้อง' },
        { status: 400 }
      );
    }

    // ตรวจสอบว่าเบอร์โทรศัพท์หรืออีเมลซ้ำหรือไม่
    const existingAdmin = await Admin.findOne({
      $or: [{ phone: formattedPhone }, { email }]
    });

    if (existingAdmin) {
      if (existingAdmin.phone === formattedPhone) {
        return NextResponse.json(
          { success: false, error: 'เบอร์โทรศัพท์นี้ถูกใช้งานแล้ว' },
          { status: 400 }
        );
      }
      if (existingAdmin.email === email) {
        return NextResponse.json(
          { success: false, error: 'อีเมลนี้ถูกใช้งานแล้ว' },
          { status: 400 }
        );
      }
    }

    // สร้างหรือค้นหา role
    let adminRole = await Role.findOne({ name: role });
    if (!adminRole) {
      // สร้าง role ใหม่หากไม่มี
      adminRole = await Role.create({
        name: role,
        level: role === 'admin' ? 1 : role === 'manager' ? 2 : 3,
        description: `Role for ${role}`,
        permissions: []
      });
    }

    // สร้างแอดมินใหม่
    const newAdmin = await Admin.create({
      name,
      phone: formattedPhone, // ใช้เบอร์โทรศัพท์ที่แปลงแล้ว
      email,
      company: company || '',
      role: adminRole._id,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    // Populate role information
    await newAdmin.populate('role', 'name level');

    console.log(`[B2B] New admin registered: ${name} (${phone})`);

    return NextResponse.json({
      success: true,
      message: 'สมัครสมาชิกสำเร็จ',
      data: {
        admin: {
          id: newAdmin._id,
          name: newAdmin.name,
          phone: newAdmin.phone,
          email: newAdmin.email,
          company: newAdmin.company,
          role: newAdmin.role.name,
          roleLevel: newAdmin.role.level
        }
      }
    });

  } catch (error) {
    console.error('[B2B] Registration error:', error);
    return NextResponse.json(
      { success: false, error: 'เกิดข้อผิดพลาดในการสมัครสมาชิก' },
      { status: 500 }
    );
  }
}
