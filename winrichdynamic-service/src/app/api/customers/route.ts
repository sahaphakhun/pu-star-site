import { NextResponse } from 'next/server';
import * as jose from 'jose';
import { cookies } from 'next/headers';
import connectDB from '@/lib/mongodb';
import Customer from '@/models/Customer';
import mongoose from 'mongoose';
import { createCustomerSchema, searchCustomerSchema } from '@/schemas/customer';
import Admin from '@/models/Admin';

// GET: ดึงลูกค้าทั้งหมด (พร้อมการค้นหาและ pagination)
export async function GET(request: Request) {
  try {
    await connectDB();
    
    const url = new URL(request.url);
    const searchParams = url.searchParams;
    const page = Number(searchParams.get('page') || '1');
    const limit = Math.min(Number(searchParams.get('limit') || '20'), 100);
    const q = searchParams.get('q') || '';
    const customerType = searchParams.get('customerType');
    const assignedTo = searchParams.get('assignedTo');
    const isActive = searchParams.get('isActive');

    // สร้าง filter object
    const filter: Record<string, any> = {};
    
    if (q) {
      filter.$or = [
        { name: { $regex: q, $options: 'i' } },
        { phoneNumber: { $regex: q, $options: 'i' } },
        { taxId: { $regex: q, $options: 'i' } },
        { companyName: { $regex: q, $options: 'i' } },
        { customerCode: { $regex: `^${q}$`, $options: 'i' } },
      ];
    }
    
    if (customerType) {
      filter.customerType = customerType;
    }
    
    if (assignedTo) {
      filter.assignedTo = { $regex: assignedTo, $options: 'i' };
    }
    
    if (isActive !== null && isActive !== undefined) {
      filter.isActive = isActive === 'true';
    }

    // RBAC: จำกัดข้อมูลสำหรับ Seller
    try {
      const authHeader = (request.headers as any).get?.('authorization') as string | null;
      const bearer = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : undefined;
      const cookieToken = (await cookies()).get('b2b_token')?.value;
      const token = bearer || cookieToken;
      if (token) {
        const payload: any = jose.decodeJwt(token);
        const roleName = String(payload.role || '').toLowerCase();
        if (roleName === 'seller') {
          // จำกัดเฉพาะของตนเอง ด้วยการใช้ adminId จาก token
          filter.assignedTo = payload.adminId;
        }
      }
    } catch {}

    // นับจำนวนทั้งหมด
    const total = await Customer.countDocuments(filter);
    
    // ดึงข้อมูลลูกค้า
    const customers = await Customer.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    const assignedAdminIds = Array.from(
      new Set(
        customers
          .map((customer) => customer.assignedTo)
          .filter((id): id is string => typeof id === 'string' && id.trim().length > 0)
      )
    );

    const validAdminIds = assignedAdminIds.filter((id) => mongoose.Types.ObjectId.isValid(id));
    const adminMap = new Map<string, string>();

    if (validAdminIds.length > 0) {
      const admins = await Admin.find({ _id: { $in: validAdminIds } })
        .select(['name', 'phone'])
        .lean();

      admins.forEach((admin) => {
        adminMap.set(
          admin._id.toString(),
          admin.name || admin.phone || 'ไม่ระบุชื่อ'
        );
      });
    }

    const customersWithAssignee = customers.map((customer) => ({
      ...customer,
      assignedToName: customer.assignedTo
        ? adminMap.get(customer.assignedTo) || customer.assignedTo
        : undefined,
    }));

    // ถ้าไม่ได้ส่ง query parameters ให้คงรูปแบบ array เดิม
    const hasSearchParams = searchParams.has('page') || searchParams.has('limit') || searchParams.has('q') || 
                           searchParams.has('customerType') || searchParams.has('assignedTo') || searchParams.has('isActive');
    
    if (!hasSearchParams) {
      return NextResponse.json(customersWithAssignee);
    }

    return NextResponse.json({
      data: customersWithAssignee,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
    
  } catch (error) {
    console.error('[Customer API] GET Error:', error);
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการดึงข้อมูลลูกค้า' },
      { status: 500 }
    );
  }
}

// POST: สร้างลูกค้าใหม่
export async function POST(request: Request) {
  try {
    const raw = await request.json();
    
    // Validate input data
    const parsed = createCustomerSchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json(
        { 
          error: 'รูปแบบข้อมูลไม่ถูกต้อง', 
          details: parsed.error.issues
        },
        { status: 400 }
      );
    }

    const customerData = { ...parsed.data } as any;

    if (customerData.shippingSameAsCompany) {
      customerData.shippingAddress = customerData.companyAddress || customerData.shippingAddress || '';
    }
    
    // ตรวจสอบว่าเบอร์โทรหรือ Tax ID ซ้ำหรือไม่
    const existingCustomer = await Customer.findOne({
      $or: [
        { phoneNumber: customerData.phoneNumber },
        ...(customerData.taxId ? [{ taxId: customerData.taxId }] : []),
        ...(customerData.email ? [{ email: customerData.email }] : []),
      ]
    });

    if (existingCustomer) {
      let errorMessage = 'ลูกค้านี้มีอยู่ในระบบแล้ว';
      if (existingCustomer.phoneNumber === customerData.phoneNumber) {
        errorMessage = 'เบอร์โทรศัพท์นี้มีลูกค้าใช้งานอยู่แล้ว';
      } else if (existingCustomer.taxId === customerData.taxId) {
        errorMessage = 'เลขประจำตัวผู้เสียภาษีนี้มีลูกค้าใช้งานอยู่แล้ว';
      } else if (existingCustomer.email === customerData.email) {
        errorMessage = 'อีเมลนี้มีลูกค้าใช้งานอยู่แล้ว';
      }
      
      return NextResponse.json(
        { error: errorMessage },
        { status: 409 }
      );
    }

    await connectDB();
    
    // ใส่ผู้รับผิดชอบจาก token (ถ้ามี) เพื่อทำ data ownership
    try {
      const authHeader = (request.headers as any).get?.('authorization') as string | null;
      const bearer = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : undefined;
      const cookieToken = (await cookies()).get('b2b_token')?.value;
      const token = bearer || cookieToken;
      if (token) {
        const payload: any = jose.decodeJwt(token);
        if (payload?.adminId) {
          (customerData as any).assignedTo = payload.adminId; // เก็บ owner เป็น adminId
        }
      }
    } catch {}

    // สร้างลูกค้าใหม่
    const customer = await Customer.create(customerData);
    
    return NextResponse.json(
      customer.toObject ? customer.toObject() : customer,
      { status: 201 }
    );
    
  } catch (error) {
    console.error('[Customer API] POST Error:', error);
    
    if (error instanceof Error && error.message.includes('duplicate key')) {
      return NextResponse.json(
        { error: 'ข้อมูลลูกค้าซ้ำกับที่มีอยู่ในระบบ' },
        { status: 409 }
      );
    }
    
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการสร้างลูกค้า' },
      { status: 500 }
    );
  }
}
