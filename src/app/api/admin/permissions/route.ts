import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import UserPermission from '@/models/UserPermission';
import User from '@/models/User';
import { verifyToken } from '@/lib/auth';

// GET - ดูรายการผู้ใช้ที่มีสิทธิ์
export async function GET(request: NextRequest) {
  try {
    // ตรวจสอบสิทธิ์แอดมิน
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

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const isActive = searchParams.get('isActive');

    // สร้าง query
    const query: any = {};
    
    if (search) {
      query.phoneNumber = { $regex: search, $options: 'i' };
    }
    
    if (isActive !== null && isActive !== '') {
      query.isActive = isActive === 'true';
    }

    // นับจำนวนทั้งหมด
    const total = await UserPermission.countDocuments(query);

    // ดึงข้อมูล
    const permissions = await UserPermission.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    // ดึงข้อมูลผู้ใช้ที่เกี่ยวข้อง
    const phoneNumbers = permissions.map(p => p.phoneNumber);
    const users = await User.find({ phoneNumber: { $in: phoneNumbers } })
      .select('phoneNumber name email profileImageUrl')
      .lean();

    // รวมข้อมูล
    const result = permissions.map(permission => {
      const user = users.find(u => u.phoneNumber === permission.phoneNumber);
      return {
        ...permission,
        userName: user?.name || 'ไม่ระบุชื่อ',
        userEmail: user?.email || '',
        userProfileImage: user?.profileImageUrl || '',
      };
    });

    return NextResponse.json({
      success: true,
      data: result,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });

  } catch (error) {
    console.error('Error fetching permissions:', error);
    return NextResponse.json(
      { success: false, message: 'เกิดข้อผิดพลาดในการดึงข้อมูลสิทธิ์' },
      { status: 500 }
    );
  }
}

// POST - เพิ่มสิทธิ์ให้ผู้ใช้
export async function POST(request: NextRequest) {
  try {
    // ตรวจสอบสิทธิ์แอดมิน
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

    const body = await request.json();
    const { phoneNumber, permissions, note } = body;

    // ตรวจสอบข้อมูลที่จำเป็น
    if (!phoneNumber || !permissions || !Array.isArray(permissions)) {
      return NextResponse.json(
        { success: false, message: 'ข้อมูลไม่ครบถ้วน' },
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

    // ตรวจสอบว่าผู้ใช้ไม่ใช่แอดมินแล้ว
    if (user.role === 'admin') {
      return NextResponse.json(
        { success: false, message: 'ไม่สามารถจัดการสิทธิ์ของแอดมินได้' },
        { status: 400 }
      );
    }

    // ดึงข้อมูลแอดมินที่ทำการให้สิทธิ์
    const adminPhone = request.headers.get('x-admin-phone');
    
    // ตรวจสอบว่ามีสิทธิ์อยู่แล้วหรือไม่
    const existingPermission = await UserPermission.findOne({ phoneNumber });

    if (existingPermission) {
      // อัปเดตสิทธิ์ที่มีอยู่
      existingPermission.permissions = permissions;
      existingPermission.note = note || '';
      existingPermission.grantedBy = adminPhone || 'admin';
      existingPermission.grantedAt = new Date();
      existingPermission.isActive = true;
      
      await existingPermission.save();

      return NextResponse.json({
        success: true,
        message: 'อัปเดตสิทธิ์เรียบร้อยแล้ว',
        data: existingPermission,
      });
    } else {
      // สร้างสิทธิ์ใหม่
      const newPermission = new UserPermission({
        phoneNumber,
        permissions,
        grantedBy: adminPhone || 'admin',
        note: note || '',
      });

      await newPermission.save();

      return NextResponse.json({
        success: true,
        message: 'เพิ่มสิทธิ์เรียบร้อยแล้ว',
        data: newPermission,
      }, { status: 201 });
    }

  } catch (error) {
    console.error('Error creating/updating permission:', error);
    return NextResponse.json(
      { success: false, message: 'เกิดข้อผิดพลาดในการจัดการสิทธิ์' },
      { status: 500 }
    );
  }
} 