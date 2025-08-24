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
    
    // ตรวจสอบว่าอีเมลซ้ำหรือไม่
    const existingAdmin = await Admin.findOne({ email: body.email });
    if (existingAdmin) {
      return NextResponse.json(
        { success: false, error: 'อีเมลนี้มีผู้ใช้งานอยู่แล้ว' },
        { status: 400 }
      );
    }
    
    // ตรวจสอบว่าบทบาทมีอยู่จริงหรือไม่
    const role = await Role.findById(body.role);
    if (!role) {
      return NextResponse.json(
        { success: false, error: 'ไม่พบบทบาทที่ระบุ' },
        { status: 400 }
      );
    }
    
    // สร้างผู้ดูแลระบบใหม่
    const admin = await Admin.create(body);
    
    // ดึงข้อมูลพร้อมบทบาท
    const populatedAdmin = await Admin.findById(admin._id)
      .populate('role', 'name description level');
    
    return NextResponse.json({
      success: true,
      message: 'สร้างผู้ดูแลระบบเรียบร้อยแล้ว',
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
