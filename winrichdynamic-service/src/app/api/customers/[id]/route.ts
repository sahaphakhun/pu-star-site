import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Customer from '@/models/Customer';
import { updateCustomerSchema } from '@/schemas/customer';

// GET: ดึงข้อมูลลูกค้าตาม ID
export async function GET(
  request: Request,
  context: any
) {
  try {
    await connectDB();
    
    const customer = await Customer.findById(context.params.id).lean();
    
    if (!customer) {
      return NextResponse.json(
        { error: 'ไม่พบลูกค้านี้' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(customer);
    
  } catch (error) {
    console.error('[Customer API] GET by ID Error:', error);
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการดึงข้อมูลลูกค้า' },
      { status: 500 }
    );
  }
}

// PUT: อัพเดทข้อมูลลูกค้า
export async function PUT(
  request: Request,
  context: any
) {
  try {
    const raw = await request.json();
    
    // Validate input data
    const parsed = updateCustomerSchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json(
        { 
          error: 'รูปแบบข้อมูลไม่ถูกต้อง', 
          details: parsed.error.errors 
        },
        { status: 400 }
      );
    }

    const updateData = parsed.data;
    
    await connectDB();
    
    // ตรวจสอบว่าลูกค้ามีอยู่จริงหรือไม่
    const existingCustomer = await Customer.findById(context.params.id);
    if (!existingCustomer) {
      return NextResponse.json(
        { error: 'ไม่พบลูกค้านี้' },
        { status: 404 }
      );
    }
    
    // ตรวจสอบว่าเบอร์โทร, Tax ID, หรือ Email ซ้ำกับลูกค้าอื่นหรือไม่
    if (updateData.phoneNumber || updateData.taxId || updateData.email) {
      const duplicateFilter: any = { _id: { $ne: context.params.id } };
      
      if (updateData.phoneNumber) {
        duplicateFilter.phoneNumber = updateData.phoneNumber;
      }
      if (updateData.taxId) {
        duplicateFilter.taxId = updateData.taxId;
      }
      if (updateData.email) {
        duplicateFilter.email = updateData.email;
      }
      
      const duplicateCustomer = await Customer.findOne(duplicateFilter);
      
      if (duplicateCustomer) {
        let errorMessage = 'ข้อมูลลูกค้าซ้ำกับที่มีอยู่ในระบบ';
        if (duplicateCustomer.phoneNumber === updateData.phoneNumber) {
          errorMessage = 'เบอร์โทรศัพท์นี้มีลูกค้าใช้งานอยู่แล้ว';
        } else if (duplicateCustomer.taxId === updateData.taxId) {
          errorMessage = 'เลขประจำตัวผู้เสียภาษีนี้มีลูกค้าใช้งานอยู่แล้ว';
        } else if (duplicateCustomer.email === updateData.email) {
          errorMessage = 'อีเมลนี้มีลูกค้าใช้งานอยู่แล้ว';
        }
        
        return NextResponse.json(
          { error: errorMessage },
          { status: 409 }
        );
      }
    }
    
    // อัพเดทข้อมูลลูกค้า
    const updatedCustomer = await Customer.findByIdAndUpdate(
      context.params.id,
      updateData,
      { 
        new: true, 
        runValidators: true 
      }
    ).lean();
    
    return NextResponse.json(updatedCustomer);
    
  } catch (error) {
    console.error('[Customer API] PUT Error:', error);
    
    if (error instanceof Error && error.message.includes('duplicate key')) {
      return NextResponse.json(
        { error: 'ข้อมูลลูกค้าซ้ำกับที่มีอยู่ในระบบ' },
        { status: 409 }
      );
    }
    
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการอัพเดทข้อมูลลูกค้า' },
      { status: 500 }
    );
  }
}

// DELETE: ลบลูกค้า (Soft Delete)
export async function DELETE(
  request: Request,
  context: any
) {
  try {
    await connectDB();
    
    // ตรวจสอบว่าลูกค้ามีอยู่จริงหรือไม่
    const existingCustomer = await Customer.findById(context.params.id);
    if (!existingCustomer) {
      return NextResponse.json(
        { error: 'ไม่พบลูกค้านี้' },
        { status: 404 }
      );
    }
    
    // Soft Delete โดยเปลี่ยนสถานะ isActive เป็น false
    const deletedCustomer = await Customer.findByIdAndUpdate(
      context.params.id,
      { isActive: false },
      { new: true }
    ).lean();
    
    return NextResponse.json({
      message: 'ลบลูกค้าเรียบร้อยแล้ว',
      customer: deletedCustomer
    });
    
  } catch (error) {
    console.error('[Customer API] DELETE Error:', error);
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการลบลูกค้า' },
      { status: 500 }
    );
  }
}
