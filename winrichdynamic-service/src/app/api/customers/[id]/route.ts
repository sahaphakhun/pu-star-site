import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Customer from '@/models/Customer';
import { updateCustomerSchema } from '@/schemas/customer';
import { z } from 'zod';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();
    
    const customer = await Customer.findById(params.id);
    
    if (!customer) {
      return NextResponse.json(
        { error: 'ไม่พบข้อมูลลูกค้า' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(customer);
  } catch (error) {
    console.error('Error fetching customer:', error);
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการดึงข้อมูลลูกค้า' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();
    
    const body = await request.json();
    
    // ตรวจสอบและแปลงข้อมูล
    const validatedData = updateCustomerSchema.parse(body);
    
    // ค้นหาลูกค้า
    const existingCustomer = await Customer.findById(params.id);
    
    if (!existingCustomer) {
      return NextResponse.json(
        { error: 'ไม่พบข้อมูลลูกค้า' },
        { status: 404 }
      );
    }
    
    // อัปเดตข้อมูลลูกค้า
    const updatedCustomer = await Customer.findByIdAndUpdate(
      params.id,
      { ...validatedData, updatedAt: new Date() },
      { new: true, runValidators: true }
    );
    
    return NextResponse.json(updatedCustomer);
  } catch (error) {
    console.error('Error updating customer:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'ข้อมูลไม่ถูกต้อง', details: error.issues },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการอัปเดตข้อมูลลูกค้า' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();
    
    const customer = await Customer.findById(params.id);
    
    if (!customer) {
      return NextResponse.json(
        { error: 'ไม่พบข้อมูลลูกค้า' },
        { status: 404 }
      );
    }
    
    await Customer.findByIdAndDelete(params.id);
    
    return NextResponse.json({ message: 'ลบข้อมูลลูกค้าเรียบร้อย' });
  } catch (error) {
    console.error('Error deleting customer:', error);
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการลบข้อมูลลูกค้า' },
      { status: 500 }
    );
  }
}
