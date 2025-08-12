import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Customer from '@/models/Customer';
import { createCustomerSchema, searchCustomerSchema } from '@/schemas/customer';

// GET: ดึงลูกค้าทั้งหมด (พร้อมการค้นหาและ pagination)
export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    const searchParams = request.nextUrl.searchParams;
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

    // นับจำนวนทั้งหมด
    const total = await Customer.countDocuments(filter);
    
    // ดึงข้อมูลลูกค้า
    const customers = await Customer.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    // ถ้าไม่ได้ส่ง query parameters ให้คงรูปแบบ array เดิม
    const hasSearchParams = searchParams.has('page') || searchParams.has('limit') || searchParams.has('q') || 
                           searchParams.has('customerType') || searchParams.has('assignedTo') || searchParams.has('isActive');
    
    if (!hasSearchParams) {
      return NextResponse.json(customers);
    }

    return NextResponse.json({
      data: customers,
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
export async function POST(request: NextRequest) {
  try {
    const raw = await request.json();
    
    // Validate input data
    const parsed = createCustomerSchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json(
        { 
          error: 'รูปแบบข้อมูลไม่ถูกต้อง', 
          details: parsed.error.errors 
        },
        { status: 400 }
      );
    }

    const customerData = parsed.data;
    
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
