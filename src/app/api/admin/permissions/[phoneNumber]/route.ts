import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import UserPermission from '@/models/UserPermission';
import User from '@/models/User';
import { verifyToken } from '@/lib/auth';

// GET - ดูสิทธิ์ของผู้ใช้เฉพาะ
export async function GET(
  request: NextRequest,
  { params }: { params: { phoneNumber: string } }
) {
  try {
    const authResult = await verifyToken(request);
    
    if (!authResult.valid) {
      return NextResponse.json(
        { success: false, message: 'ไม่มีสิทธิ์เข้าถึง - ต้องเข้าสู่ระบบ' },
        { status: 401 }
      );
    }

    const phoneNumber = decodeURIComponent(params.phoneNumber);
    
    // ตรวจสอบสิทธิ์: แอดมินดูได้ทุกคน หรือผู้ใช้ดูของตัวเองได้
    const isAdmin = authResult.decoded?.role === 'admin';
    const isOwnData = authResult.decoded?.phoneNumber === phoneNumber;
    
    if (!isAdmin && !isOwnData) {
      return NextResponse.json(
        { success: false, message: 'ไม่มีสิทธิ์เข้าถึงข้อมูลของผู้ใช้นี้' },
        { status: 403 }
      );
    }

    await connectDB();
    
    // ดึงข้อมูลสิทธิ์
    const permission = await UserPermission.findOne({ phoneNumber }).lean();
    
    if (!permission) {
      return NextResponse.json(
        { success: false, message: 'ไม่พบข้อมูลสิทธิ์ของผู้ใช้นี้' },
        { status: 404 }
      );
    }

    // ดึงข้อมูลผู้ใช้
    const user = await User.findOne({ phoneNumber })
      .select('phoneNumber name email profileImageUrl role')
      .lean();

    const result = {
      ...permission,
      userName: user?.name || 'ไม่ระบุชื่อ',
      userEmail: user?.email || '',
      userProfileImage: user?.profileImageUrl || '',
      userRole: user?.role || 'user',
    };

    return NextResponse.json({
      success: true,
      data: result,
    });

  } catch (error) {
    console.error('Error fetching user permission:', error);
    return NextResponse.json(
      { success: false, message: 'เกิดข้อผิดพลาดในการดึงข้อมูลสิทธิ์' },
      { status: 500 }
    );
  }
}

// PUT - แก้ไขสิทธิ์ของผู้ใช้
export async function PUT(
  request: NextRequest,
  { params }: { params: { phoneNumber: string } }
) {
  try {
    const authResult = await verifyToken(request);
    
    if (!authResult.valid) {
      return NextResponse.json(
        { success: false, message: 'ไม่มีสิทธิ์เข้าถึง - ต้องเข้าสู่ระบบ' },
        { status: 401 }
      );
    }
    
    if (authResult.decoded?.role !== 'admin') {
      return NextResponse.json(
        { success: false, message: 'ไม่มีสิทธิ์เข้าถึง - ต้องเป็นแอดมิน' },
        { status: 403 }
      );
    }

    await connectDB();

    const phoneNumber = decodeURIComponent(params.phoneNumber);
    const body = await request.json();
    const { permissions, isActive, note } = body;

    // ตรวจสอบข้อมูลที่จำเป็น
    if (!permissions || !Array.isArray(permissions)) {
      return NextResponse.json(
        { success: false, message: 'ข้อมูลสิทธิ์ไม่ถูกต้อง' },
        { status: 400 }
      );
    }

    // ตรวจสอบว่าผู้ใช้มีอยู่ในระบบหรือไม่
    const user = await User.findOne({ phoneNumber });
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'ไม่พบผู้ใช้ในระบบ' },
        { status: 404 }
      );
    }

    // ตรวจสอบว่าผู้ใช้ไม่ใช่แอดมิน
    if (user.role === 'admin') {
      return NextResponse.json(
        { success: false, message: 'ไม่สามารถจัดการสิทธิ์ของแอดมินได้' },
        { status: 400 }
      );
    }

    // ดึงข้อมูลแอดมินที่ทำการแก้ไข
    const adminPhone = request.headers.get('x-admin-phone');
    
    // อัปเดตสิทธิ์
    const updatedPermission = await UserPermission.findOneAndUpdate(
      { phoneNumber },
      {
        permissions,
        isActive: isActive !== undefined ? isActive : true,
        note: note || '',
        grantedBy: adminPhone || 'admin',
        grantedAt: new Date(),
      },
      { new: true, upsert: true }
    );

    return NextResponse.json({
      success: true,
      message: 'แก้ไขสิทธิ์เรียบร้อยแล้ว',
      data: updatedPermission,
    });

  } catch (error) {
    console.error('Error updating user permission:', error);
    return NextResponse.json(
      { success: false, message: 'เกิดข้อผิดพลาดในการแก้ไขสิทธิ์' },
      { status: 500 }
    );
  }
}

// DELETE - ลบสิทธิ์ของผู้ใช้ (ตั้งค่า isActive เป็น false)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { phoneNumber: string } }
) {
  try {
    const authResult = await verifyToken(request);
    
    if (!authResult.valid) {
      return NextResponse.json(
        { success: false, message: 'ไม่มีสิทธิ์เข้าถึง - ต้องเข้าสู่ระบบ' },
        { status: 401 }
      );
    }
    
    if (authResult.decoded?.role !== 'admin') {
      return NextResponse.json(
        { success: false, message: 'ไม่มีสิทธิ์เข้าถึง - ต้องเป็นแอดมิน' },
        { status: 403 }
      );
    }

    await connectDB();

    const phoneNumber = decodeURIComponent(params.phoneNumber);
    
    // ตรวจสอบว่าผู้ใช้มีสิทธิ์อยู่หรือไม่
    const permission = await UserPermission.findOne({ phoneNumber });
    
    if (!permission) {
      return NextResponse.json(
        { success: false, message: 'ไม่พบข้อมูลสิทธิ์ของผู้ใช้นี้' },
        { status: 404 }
      );
    }

    // ตั้งค่า isActive เป็น false แทนการลบจริง
    permission.isActive = false;
    permission.permissions = [];
    await permission.save();

    return NextResponse.json({
      success: true,
      message: 'ลบสิทธิ์เรียบร้อยแล้ว',
    });

  } catch (error) {
    console.error('Error deleting user permission:', error);
    return NextResponse.json(
      { success: false, message: 'เกิดข้อผิดพลาดในการลบสิทธิ์' },
      { status: 500 }
    );
  }
} 