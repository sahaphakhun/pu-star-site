import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Admin from '@/models/Admin';
import Role from '@/models/Role';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;
    
    const admin = await Admin.findById(id)
      .populate('role', 'name description level');
    
    if (!admin) {
      return NextResponse.json(
        { success: false, error: 'ไม่พบผู้ดูแลระบบที่ระบุ' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      data: admin
    });
  } catch (error) {
    console.error('Error fetching admin:', error);
    return NextResponse.json(
      { success: false, error: 'เกิดข้อผิดพลาดในการดึงข้อมูลผู้ดูแลระบบ' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;
    const body = await request.json();
    
    // ตรวจสอบว่าผู้ดูแลระบบมีอยู่จริงหรือไม่
    const existingAdmin = await Admin.findById(id);
    if (!existingAdmin) {
      return NextResponse.json(
        { success: false, error: 'ไม่พบผู้ดูแลระบบที่ระบุ' },
        { status: 404 }
      );
    }
    
    // ตรวจสอบว่าอีเมลซ้ำหรือไม่ (ยกเว้นผู้ดูแลระบบที่กำลังแก้ไข)
    if (body.email && body.email !== existingAdmin.email) {
      const emailExists = await Admin.findOne({ email: body.email });
      if (emailExists) {
        return NextResponse.json(
          { success: false, error: 'อีเมลนี้มีผู้ใช้งานอยู่แล้ว' },
          { status: 400 }
        );
      }
    }
    
    // ตรวจสอบว่าบทบาทมีอยู่จริงหรือไม่ (ถ้ามีการเปลี่ยนบทบาท)
    if (body.role && body.role !== existingAdmin.role.toString()) {
      const role = await Role.findById(body.role);
      if (!role) {
        return NextResponse.json(
          { success: false, error: 'ไม่พบบทบาทที่ระบุ' },
          { status: 400 }
        );
      }
    }
    
    // อัปเดตข้อมูล
    const admin = await Admin.findByIdAndUpdate(
      id,
      body,
      { new: true, runValidators: true }
    ).populate('role', 'name description level');
    
    return NextResponse.json({
      success: true,
      message: 'อัปเดตข้อมูลผู้ดูแลระบบเรียบร้อยแล้ว',
      data: admin
    });
  } catch (error) {
    console.error('Error updating admin:', error);
    return NextResponse.json(
      { success: false, error: 'เกิดข้อผิดพลาดในการอัปเดตข้อมูลผู้ดูแลระบบ' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;
    
    const admin = await Admin.findById(id)
      .populate('role', 'name level');
    
    if (!admin) {
      return NextResponse.json(
        { success: false, error: 'ไม่พบผู้ดูแลระบบที่ระบุ' },
        { status: 404 }
      );
    }
    
    // ตรวจสอบว่าเป็น Super Admin หรือไม่
    if (admin.role.level === 1) {
      return NextResponse.json(
        { success: false, error: 'ไม่สามารถลบ Super Admin ได้' },
        { status: 400 }
      );
    }
    
    await Admin.findByIdAndDelete(id);
    
    return NextResponse.json({
      success: true,
      message: 'ลบผู้ดูแลระบบเรียบร้อยแล้ว'
    });
  } catch (error) {
    console.error('Error deleting admin:', error);
    return NextResponse.json(
      { success: false, error: 'เกิดข้อผิดพลาดในการลบผู้ดูแลระบบ' },
      { status: 500 }
    );
  }
}
