import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Admin from '@/models/Admin';
import Role from '@/models/Role';

export async function GET() {
  try {
    await connectDB();
    
    // ดึงผู้ดูแลระบบทั้งหมดพร้อมข้อมูลบทบาท
    const admins = await Admin.find()
      .populate('role', 'name description level')
      .sort({ createdAt: -1 });
    
    return NextResponse.json({
      success: true,
      data: admins
    });
  } catch (error) {
    console.error('Error fetching admins:', error);
    return NextResponse.json(
      { success: false, error: 'เกิดข้อผิดพลาดในการดึงข้อมูลผู้ดูแลระบบ' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const body = await request.json();

    // ตรวจสอบฟิลด์จำเป็น: name, phone, role
    if (!body?.name || !body?.phone || !body?.role) {
      return NextResponse.json(
        { success: false, error: 'กรุณาระบุชื่อ เบอร์โทรศัพท์ และบทบาท' },
        { status: 400 }
      );
    }

    // ตรวจสอบรูปแบบเบอร์ (ยอมรับ 66xxxxxxxxx หรือ +66xxxxxxxxx หรือ 0xxxxxxxxx)
    const rawPhone: string = String(body.phone).trim();
    const normalized = rawPhone.startsWith('+66') ? rawPhone.slice(1) : rawPhone.startsWith('0') ? `66${rawPhone.slice(1)}` : rawPhone;
    if (!/^66\d{9}$/.test(normalized)) {
      return NextResponse.json(
        { success: false, error: 'รูปแบบเบอร์โทรศัพท์ไม่ถูกต้อง (ตัวอย่าง: 0812345678, +66812345678, 66123456789)' },
        { status: 400 }
      );
    }

    // ตรวจสอบซ้ำจาก phone/email
    const existingByPhone = await Admin.findOne({ phone: normalized });
    if (existingByPhone) {
      return NextResponse.json(
        { success: false, error: 'เบอร์โทรนี้มีผู้ใช้งานอยู่แล้ว' },
        { status: 400 }
      );
    }
    if (body.email) {
      const existingByEmail = await Admin.findOne({ email: body.email });
      if (existingByEmail) {
        return NextResponse.json(
          { success: false, error: 'อีเมลนี้มีผู้ใช้งานอยู่แล้ว' },
          { status: 400 }
        );
      }
    }

    // ตรวจสอบว่าบทบาทมีอยู่จริงหรือไม่
    const role = await Role.findById(body.role);
    if (!role) {
      return NextResponse.json(
        { success: false, error: 'ไม่พบบทบาทที่ระบุ' },
        { status: 400 }
      );
    }
    
    // สร้างผู้ดูแลระบบใหม่ (seller/admin)
    const admin = await Admin.create({
      name: body.name,
      phone: normalized,
      email: body.email || undefined,
      company: body.company || undefined,
      role: role._id,
      isActive: body.isActive !== false
    });
    
    // ดึงข้อมูลพร้อมบทบาท
    const populatedAdmin = await Admin.findById(admin._id)
      .populate('role', 'name description level');
    
    return NextResponse.json({
      success: true,
      message: 'สร้างผู้ใช้เรียบร้อยแล้ว',
      data: populatedAdmin
    });
  } catch (error) {
    console.error('Error creating admin:', error);
    return NextResponse.json(
      { success: false, error: 'เกิดข้อผิดพลาดในการสร้างผู้ดูแลระบบ' },
      { status: 500 }
    );
  }
}
