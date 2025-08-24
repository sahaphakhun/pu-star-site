import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Role from '@/models/Role';

// ข้อมูลสิทธิ์พื้นฐาน
const basePermissions = [
  // การจัดการลูกค้า
  { id: 'customers.view', name: 'ดูข้อมูลลูกค้า', description: 'สามารถดูรายการลูกค้าได้', category: 'customers' },
  { id: 'customers.create', name: 'สร้างลูกค้าใหม่', description: 'สามารถสร้างลูกค้าใหม่ได้', category: 'customers' },
  { id: 'customers.edit', name: 'แก้ไขข้อมูลลูกค้า', description: 'สามารถแก้ไขข้อมูลลูกค้าได้', category: 'customers' },
  { id: 'customers.delete', name: 'ลบลูกค้า', description: 'สามารถลบลูกค้าได้', category: 'customers' },
  
  // การจัดการใบเสนอราคา
  { id: 'quotations.view', name: 'ดูใบเสนอราคา', description: 'สามารถดูรายการใบเสนอราคาได้', category: 'quotations' },
  { id: 'quotations.create', name: 'สร้างใบเสนอราคา', description: 'สามารถสร้างใบเสนอราคาใหม่ได้', category: 'quotations' },
  { id: 'quotations.edit', name: 'แก้ไขใบเสนอราคา', description: 'สามารถแก้ไขใบเสนอราคาได้', category: 'quotations' },
  { id: 'quotations.delete', name: 'ลบใบเสนอราคา', description: 'สามารถลบใบเสนอราคาได้', category: 'quotations' },
  { id: 'quotations.send', name: 'ส่งใบเสนอราคา', description: 'สามารถส่งใบเสนอราคาได้', category: 'quotations' },
  
  // การจัดการสินค้า
  { id: 'products.view', name: 'ดูข้อมูลสินค้า', description: 'สามารถดูรายการสินค้าได้', category: 'products' },
  { id: 'products.create', name: 'สร้างสินค้าใหม่', description: 'สามารถสร้างสินค้าใหม่ได้', category: 'products' },
  { id: 'products.edit', name: 'แก้ไขข้อมูลสินค้า', description: 'สามารถแก้ไขข้อมูลสินค้าได้', category: 'products' },
  { id: 'products.delete', name: 'ลบสินค้า', description: 'สามารถลบสินค้าได้', category: 'products' },
  
  // การจัดการออเดอร์
  { id: 'orders.view', name: 'ดูออเดอร์', description: 'สามารถดูรายการออเดอร์ได้', category: 'orders' },
  { id: 'orders.create', name: 'สร้างออเดอร์', description: 'สามารถสร้างออเดอร์ใหม่ได้', category: 'orders' },
  { id: 'orders.edit', name: 'แก้ไขออเดอร์', description: 'สามารถแก้ไขออเดอร์ได้', category: 'orders' },
  { id: 'orders.delete', name: 'ลบออเดอร์', description: 'สามารถลบออเดอร์ได้', category: 'orders' },
  
  // การจัดการระบบ
  { id: 'settings.view', name: 'ดูการตั้งค่า', description: 'สามารถดูการตั้งค่าระบบได้', category: 'settings' },
  { id: 'settings.edit', name: 'แก้ไขการตั้งค่า', description: 'สามารถแก้ไขการตั้งค่าระบบได้', category: 'settings' },
  { id: 'admins.view', name: 'ดูผู้ดูแลระบบ', description: 'สามารถดูรายการผู้ดูแลระบบได้', category: 'admins' },
  { id: 'admins.create', name: 'สร้างผู้ดูแลระบบ', description: 'สามารถสร้างผู้ดูแลระบบใหม่ได้', category: 'admins' },
  { id: 'admins.edit', name: 'แก้ไขผู้ดูแลระบบ', description: 'สามารถแก้ไขข้อมูลผู้ดูแลระบบได้', category: 'admins' },
  { id: 'admins.delete', name: 'ลบผู้ดูแลระบบ', description: 'สามารถลบผู้ดูแลระบบได้', category: 'admins' },
  { id: 'roles.view', name: 'ดูบทบาท', description: 'สามารถดูรายการบทบาทได้', category: 'roles' },
  { id: 'roles.create', name: 'สร้างบทบาท', description: 'สามารถสร้างบทบาทใหม่ได้', category: 'roles' },
  { id: 'roles.edit', name: 'แก้ไขบทบาท', description: 'สามารถแก้ไขบทบาทได้', category: 'roles' },
  { id: 'roles.delete', name: 'ลบบทบาท', description: 'สามารถลบบทบาทได้', category: 'roles' }
];

// บทบาทพื้นฐาน
const baseRoles = [
  {
    name: 'Super Admin',
    description: 'ผู้ดูแลระบบสูงสุด มีสิทธิ์ทุกอย่าง',
    level: 1,
    permissions: basePermissions.map(p => p.id),
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

export async function GET() {
  try {
    await connectDB();
    
    // ดึงบทบาททั้งหมด
    const roles = await Role.find().sort({ level: 1, name: 1 });
    
    return NextResponse.json({
      success: true,
      data: {
        roles,
        permissions: basePermissions
      }
    });
  } catch (error) {
    console.error('Error fetching roles:', error);
    return NextResponse.json(
      { success: false, error: 'เกิดข้อผิดพลาดในการดึงข้อมูลบทบาท' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const body = await request.json();
    
    // สร้างบทบาทใหม่
    const role = await Role.create(body);
    
    return NextResponse.json({
      success: true,
      message: 'สร้างบทบาทเรียบร้อยแล้ว',
      data: role
    });
  } catch (error) {
    console.error('Error creating role:', error);
    return NextResponse.json(
      { success: false, error: 'เกิดข้อผิดพลาดในการสร้างบทบาท' },
      { status: 500 }
    );
  }
}

// API สำหรับสร้างข้อมูลเริ่มต้น
export async function PUT(request: NextRequest) {
  try {
    await connectDB();
    
    // สร้างบทบาทพื้นฐานถ้ายังไม่มี
    for (const baseRole of baseRoles) {
      await Role.findOneAndUpdate(
        { name: baseRole.name },
        baseRole,
        { upsert: true }
      );
    }
    
    return NextResponse.json({
      success: true,
      message: 'สร้างข้อมูลบทบาทเริ่มต้นเรียบร้อยแล้ว'
    });
  } catch (error) {
    console.error('Error initializing roles:', error);
    return NextResponse.json(
      { success: false, error: 'เกิดข้อผิดพลาดในการสร้างข้อมูลเริ่มต้น' },
      { status: 500 }
    );
  }
}
