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

    // ตรวจสอบว่าบทบาทมีอยู่จริงหรือไม่ (รองรับทั้ง ID และ name)
    let role;
    
    // ตรวจสอบว่าเป็น ObjectId ที่ถูกต้องหรือไม่
    const isValidObjectId = /^[0-9a-fA-F]{24}$/.test(body.role);
    
    if (isValidObjectId) {
      // ถ้าเป็น ObjectId ที่ถูกต้อง ให้หาจาก ID
      role = await Role.findById(body.role);
    } else {
      // ถ้าไม่ใช่ ObjectId ให้หาจาก name
      const roleName = body.role.toLowerCase();
      if (roleName === 'super_admin') {
        role = await Role.findOne({ name: 'Super Admin' });
      } else if (roleName === 'sales_admin') {
        role = await Role.findOne({ name: 'Sales Admin' });
      } else if (roleName === 'seller') {
        role = await Role.findOne({ name: 'Seller' });
      }
    }
    
    // ถ้ายังไม่เจอ ให้สร้างบทบาทพื้นฐาน
    if (!role) {
      const roleName = body.role.toLowerCase();
      let newRole;
      
      try {
        if (roleName === 'super_admin') {
          newRole = await Role.create({
            name: 'Super Admin',
            description: 'ผู้ดูแลระบบสูงสุด มีสิทธิ์ทุกอย่าง',
            level: 1,
            permissions: ['customers.view', 'customers.create', 'customers.edit', 'customers.delete', 'quotations.view', 'quotations.create', 'quotations.edit', 'quotations.delete', 'quotations.send', 'products.view', 'products.create', 'products.edit', 'products.delete', 'orders.view', 'orders.create', 'orders.edit', 'orders.delete', 'settings.view', 'settings.edit', 'admins.view', 'admins.create', 'admins.edit', 'admins.delete', 'roles.view', 'roles.create', 'roles.edit', 'roles.delete']
          });
        } else if (roleName === 'sales_admin') {
          newRole = await Role.create({
            name: 'Sales Admin',
            description: 'ผู้ดูแลระบบฝ่ายขาย จัดการลูกค้าและใบเสนอราคา',
            level: 2,
            permissions: ['customers.view', 'customers.create', 'customers.edit', 'quotations.view', 'quotations.create', 'quotations.edit', 'quotations.send', 'products.view', 'orders.view', 'orders.create', 'orders.edit', 'settings.view']
          });
        } else if (roleName === 'seller') {
          newRole = await Role.create({
            name: 'Seller',
            description: 'พนักงานขาย เห็นเฉพาะลูกค้าและใบเสนอราคาของตนเอง',
            level: 5,
            permissions: ['customers.view', 'customers.create', 'customers.edit', 'quotations.view', 'quotations.create', 'quotations.edit', 'quotations.send']
          });
        } else {
          return NextResponse.json(
            { success: false, error: 'ไม่พบบทบาทที่ระบุ' },
            { status: 400 }
          );
        }
        role = newRole;
        console.log('Created new role:', role.name);
      } catch (roleError) {
        console.error('Error creating role:', roleError);
        return NextResponse.json(
          { success: false, error: 'เกิดข้อผิดพลาดในการสร้างบทบาท' },
          { status: 500 }
        );
      }
    }
    
    // สร้างผู้ดูแลระบบใหม่ (seller/admin)
    try {
      console.log('Creating admin with data:', {
        name: body.name,
        phone: normalized,
        email: body.email,
        company: body.company,
        role: role._id,
        team: body.team,
        zone: body.zone
      });

      const admin = await Admin.create({
        name: body.name,
        phone: normalized,
        email: body.email || undefined,
        company: body.company || undefined,
        role: role._id,
        team: body.team || undefined,
        zone: body.zone || undefined,
        isActive: body.isActive !== false
      });
      
      console.log('Admin created successfully:', admin._id);
      
      // ดึงข้อมูลพร้อมบทบาท
      const populatedAdmin = await Admin.findById(admin._id)
        .populate('role', 'name description level');
      
      return NextResponse.json({
        success: true,
        message: 'สร้างผู้ใช้เรียบร้อยแล้ว',
        data: populatedAdmin
      });
    } catch (adminError) {
      console.error('Error creating admin:', adminError);
      const errorMessage = adminError instanceof Error ? adminError.message : 'Unknown error';
      return NextResponse.json(
        { success: false, error: 'เกิดข้อผิดพลาดในการสร้างผู้ดูแลระบบ: ' + errorMessage },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error creating admin:', error);
    return NextResponse.json(
      { success: false, error: 'เกิดข้อผิดพลาดในการสร้างผู้ดูแลระบบ' },
      { status: 500 }
    );
  }
}
