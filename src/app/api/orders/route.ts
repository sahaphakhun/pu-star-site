import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Order from '@/models/Order';

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    // ดึงค่า query parameters
    const searchParams = request.nextUrl.searchParams;
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    let query = {};
    
    // ถ้ามีการระบุช่วงวันที่
    if (startDate && endDate) {
      query = {
        orderDate: {
          $gte: new Date(startDate),
          $lte: new Date(`${endDate}T23:59:59`)
        }
      };
    }

    const orders = await Order.find(query).sort({ orderDate: -1 });
    return NextResponse.json(orders);
  } catch (error) {
    console.error('Error fetching orders:', error);
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการดึงข้อมูลคำสั่งซื้อ' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { customerName, customerPhone, items, totalAmount } = body;

    // ตรวจสอบข้อมูลที่จำเป็น
    if (!customerName || !customerPhone || !items || items.length === 0 || !totalAmount) {
      return NextResponse.json(
        { error: 'กรุณากรอกข้อมูลให้ครบถ้วน' },
        { status: 400 }
      );
    }

    await connectDB();
    
    const order = await Order.create({
      customerName,
      customerPhone,
      items,
      totalAmount,
      orderDate: new Date()
    });

    return NextResponse.json(order, { status: 201 });
  } catch (error) {
    console.error('Error creating order:', error);
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการสร้างคำสั่งซื้อ' },
      { status: 500 }
    );
  }
} 