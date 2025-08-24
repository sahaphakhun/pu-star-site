import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Role from '@/models/Role';
import Admin from '@/models/Admin';
import Settings from '@/models/Settings';

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    
    // 1. สร้างบทบาทพื้นฐาน
    const baseRoles = [
      {
        name: 'Super Admin',
        description: 'ผู้ดูแลระบบสูงสุด มีสิทธิ์ทุกอย่าง',
        level: 1,
        permissions: [
          'customers.view', 'customers.create', 'customers.edit', 'customers.delete',
          'quotations.view', 'quotations.create', 'quotations.edit', 'quotations.delete', 'quotations.send',
          'products.view', 'products.create', 'products.edit', 'products.delete',
          'orders.view', 'orders.create', 'orders.edit', 'orders.delete',
          'settings.view', 'settings.edit',
          'admins.view', 'admins.create', 'admins.edit', 'admins.delete',
          'roles.view', 'roles.create', 'roles.edit', 'roles.delete'
        ],
        isSystem: true
      },
      {
        name: 'Sales Admin',
        description: 'ผู้ดูแลระบบฝ่ายขาย จัดการลูกค้าและใบเสนอราคา',
        level: 2,
        permissions: [
          'customers.view', 'customers.create', 'customers.edit',
          'quotations.view', 'quotations.create', 'quotations.edit', 'quotations.send',
          'products.view',
          'orders.view', 'orders.create', 'orders.edit',
          'settings.view'
        ],
        isSystem: true
      },
      {
        name: 'Warehouse Admin',
        description: 'ผู้ดูแลระบบคลังสินค้า จัดการสินค้าและออเดอร์',
        level: 3,
        permissions: [
          'products.view', 'products.create', 'products.edit',
          'orders.view', 'orders.edit',
          'settings.view'
        ],
        isSystem: true
      }
    ];

    const createdRoles = [];
    for (const baseRole of baseRoles) {
      const role = await Role.findOneAndUpdate(
        { name: baseRole.name },
        baseRole,
        { upsert: true, new: true }
      );
      createdRoles.push(role);
    }

    // 2. สร้าง Super Admin เริ่มต้น
    const superAdminRole = createdRoles.find(role => role.name === 'Super Admin');
    if (superAdminRole) {
      const existingSuperAdmin = await Admin.findOne({ email: 'admin@winrich.com' });
      if (!existingSuperAdmin) {
        await Admin.create({
          name: 'Super Admin',
          email: 'admin@winrich.com',
          password: 'admin123', // จะถูก hash อัตโนมัติ
          role: superAdminRole._id,
          isActive: true
        });
      }
    }

    // 3. สร้างการตั้งค่าเริ่มต้น
    const existingSettings = await Settings.findOne();
    if (!existingSettings) {
      await Settings.create({
        companyName: 'WinRich Dynamic Co., Ltd.',
        companyAddress: '123 ถนนสุขุมวิท แขวงคลองเตย เขตคลองเตย กรุงเทพฯ 10110',
        companyPhone: '+66 2 123 4567',
        companyEmail: 'info@winrich.com',
        companyTaxId: '0123456789012',
        quotationPrefix: 'QT',
        quotationValidityDays: 30,
        defaultVatRate: 7,
        defaultPaymentTerms: 'ชำระเงินภายใน 30 วัน',
        defaultDeliveryTerms: 'จัดส่งภายใน 7 วันหลังจากยืนยันออเดอร์',
        emailSettings: {
          smtpHost: 'smtp.gmail.com',
          smtpPort: 587,
          smtpUser: '',
          smtpPass: '',
          fromEmail: 'noreply@winrich.com',
          fromName: 'WinRich Dynamic'
        },
        notificationSettings: {
          emailNotifications: true,
          lineNotifications: false,
          lineChannelSecret: '',
          lineChannelAccessToken: ''
        }
      });
    }

    return NextResponse.json({
      success: true,
      message: 'สร้างข้อมูลเริ่มต้นเรียบร้อยแล้ว',
      data: {
        roles: createdRoles.length,
        superAdminCreated: !existingSuperAdmin,
        settingsCreated: !existingSettings
      }
    });
  } catch (error) {
    console.error('Error initializing system:', error);
    return NextResponse.json(
      { success: false, error: 'เกิดข้อผิดพลาดในการสร้างข้อมูลเริ่มต้น' },
      { status: 500 }
    );
  }
}
