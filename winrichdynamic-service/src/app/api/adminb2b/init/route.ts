import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Admin from '@/models/Admin';
import Role from '@/models/Role';

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    // ตรวจสอบสถานะระบบ
    const adminCount = await Admin.countDocuments();
    const roleCount = await Role.countDocuments();
    
    return NextResponse.json({
      success: true,
      message: 'B2B Admin API initialized successfully',
      data: {
        isInitialized: adminCount > 0,
        adminCount,
        roleCount,
        systemStatus: adminCount > 0 ? 'ready' : 'needs_init',
        timestamp: new Date().toISOString(),
        version: '1.0.0'
      }
    });
  } catch (error) {
    console.error('[B2B] Init API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    
    // สร้าง role พื้นฐาน
    const defaultRoles = [
      { name: 'admin', description: 'ผู้ดูแลระบบ', level: 1 },
      { name: 'manager', description: 'ผู้จัดการ', level: 2 },
      { name: 'staff', description: 'พนักงาน', level: 3 }
    ];

    for (const roleData of defaultRoles) {
      const existingRole = await Role.findOne({ name: roleData.name });
      if (!existingRole) {
        const role = new Role(roleData);
        await role.save();
        console.log(`[B2B] Created role: ${roleData.name}`);
      }
    }

    // สร้าง admin เริ่มต้น (ถ้ายังไม่มี)
    const adminCount = await Admin.countDocuments();
    if (adminCount === 0) {
      const adminRole = await Role.findOne({ name: 'admin' });
      if (adminRole) {
        const defaultAdmin = new Admin({
          name: 'System Administrator',
          phone: '0999999999',
          email: 'admin@winrichdynamic.com',
          company: 'WinRich Dynamic',
          role: adminRole._id,
          isActive: true
        });
        await defaultAdmin.save();
        console.log('[B2B] Created default admin account');
      }
    }

    // ตรวจสอบสถานะระบบใหม่
    const newAdminCount = await Admin.countDocuments();
    const newRoleCount = await Role.countDocuments();
    
    return NextResponse.json({
      success: true,
      message: 'ระบบได้ถูกเริ่มต้นเรียบร้อยแล้ว',
      data: {
        isInitialized: newAdminCount > 0,
        adminCount: newAdminCount,
        roleCount: newRoleCount,
        systemStatus: 'ready'
      }
    });

  } catch (error) {
    console.error('[B2B] System initialization error:', error);
    return NextResponse.json(
      { success: false, error: 'เกิดข้อผิดพลาดในการเริ่มต้นระบบ' },
      { status: 500 }
    );
  }
}
