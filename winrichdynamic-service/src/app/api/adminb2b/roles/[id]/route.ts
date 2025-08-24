import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Role from '@/models/Role';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;
    
    const role = await Role.findById(id);
    
    if (!role) {
      return NextResponse.json(
        { success: false, error: 'ไม่พบบทบาทที่ระบุ' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      data: role
    });
  } catch (error) {
    console.error('Error fetching role:', error);
    return NextResponse.json(
      { success: false, error: 'เกิดข้อผิดพลาดในการดึงข้อมูลบทบาท' },
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
    
    const role = await Role.findByIdAndUpdate(
      id,
      body,
      { new: true, runValidators: true }
    );
    
    if (!role) {
      return NextResponse.json(
        { success: false, error: 'ไม่พบบทบาทที่ระบุ' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      message: 'อัปเดตบทบาทเรียบร้อยแล้ว',
      data: role
    });
  } catch (error) {
    console.error('Error updating role:', error);
    return NextResponse.json(
      { success: false, error: 'เกิดข้อผิดพลาดในการอัปเดตบทบาท' },
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
    
    const role = await Role.findById(id);
    
    if (!role) {
      return NextResponse.json(
        { success: false, error: 'ไม่พบบทบาทที่ระบุ' },
        { status: 404 }
      );
    }
    
    // ตรวจสอบว่าเป็น system role หรือไม่
    if (role.isSystem) {
      return NextResponse.json(
        { success: false, error: 'ไม่สามารถลบบทบาทระบบได้' },
        { status: 400 }
      );
    }
    
    await Role.findByIdAndDelete(id);
    
    return NextResponse.json({
      success: true,
      message: 'ลบบทบาทเรียบร้อยแล้ว'
    });
  } catch (error) {
    console.error('Error deleting role:', error);
    return NextResponse.json(
      { success: false, error: 'เกิดข้อผิดพลาดในการลบบทบาท' },
      { status: 500 }
    );
  }
}
