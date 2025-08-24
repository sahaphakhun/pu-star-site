import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Admin from '@/models/Admin';
import Role from '@/models/Role';

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    
    // ตรวจสอบว่ามีแอดมินในระบบหรือไม่
    const adminCount = await Admin.countDocuments();
    
    if (adminCount > 0) {
      return NextResponse.json({
        success: false,
        message: 'ระบบได้ถูกเริ่มต้นแล้ว',
        data: { adminCount }
      });
    }

    // สร้าง roles เริ่มต้น
    const roles = [
      {
        name: 'superadmin',
        level: 0,
        description: 'Super Administrator - มีสิทธิ์สูงสุดในระบบ',
        permissions: ['*']
      },
      {
        name: 'admin',
        level: 1,
        description: 'Administrator - ผู้ดูแลระบบ',
        permissions: ['admin.*', 'products.*', 'customers.*', 'orders.*', 'quotations.*']
      },
      {
        name: 'manager',
        level: 2,
        description: 'Manager - ผู้จัดการ',
        permissions: ['products.read', 'customers.*', 'orders.*', 'quotations.*']
      },
      {
        name: 'staff',
        level: 3,
        description: 'Staff - พนักงาน',
        permissions: ['products.read', 'customers.read', 'orders.read', 'quotations.read']
      }
    ];

    const createdRoles = await Role.insertMany(roles);
    console.log('[B2B] Created roles:', createdRoles.map(r => r.name));

    // สร้างแอดมินเริ่มต้น
    const superAdminRole = createdRoles.find(r => r.name === 'superadmin');
    if (!superAdminRole) {
      throw new Error('ไม่สามารถสร้าง superadmin role ได้');
    }

    const defaultAdmin = await Admin.create({
      name: 'Super Administrator',
      phone: '66812345678', // ใช้รูปแบบ 66xxxxxxxxx สำหรับแอดมินเริ่มต้น
      email: 'admin@winrichdynamic.com', // เปลี่ยนเป็นอีเมลจริง
      company: 'WinRich Dynamic',
      role: superAdminRole._id,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    await defaultAdmin.populate('role', 'name level');

    console.log(`[B2B] Created default admin: ${defaultAdmin.name} (${defaultAdmin.phone})`);

    return NextResponse.json({
      success: true,
      message: 'เริ่มต้นระบบสำเร็จ',
      data: {
        rolesCreated: createdRoles.length,
        defaultAdmin: {
          id: defaultAdmin._id,
          name: defaultAdmin.name,
          phone: defaultAdmin.phone,
          email: defaultAdmin.email,
          role: defaultAdmin.role.name,
          roleLevel: defaultAdmin.role.level
        }
      }
    });

  } catch (error) {
    console.error('[B2B] Init error:', error);
    return NextResponse.json(
      { success: false, error: 'เกิดข้อผิดพลาดในการเริ่มต้นระบบ' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    // ตรวจสอบสถานะระบบ
    const adminCount = await Admin.countDocuments();
    const roleCount = await Role.countDocuments();
    
    return NextResponse.json({
      success: true,
      message: 'สถานะระบบ',
      data: {
        isInitialized: adminCount > 0,
        adminCount,
        roleCount,
        systemStatus: adminCount > 0 ? 'ready' : 'needs_init'
      }
    });

  } catch (error) {
    console.error('[B2B] Status check error:', error);
    return NextResponse.json(
      { success: false, error: 'เกิดข้อผิดพลาดในการตรวจสอบสถานะระบบ' },
      { status: 500 }
    );
  }
}
