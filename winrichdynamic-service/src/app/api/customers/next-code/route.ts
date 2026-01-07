import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Customer from '@/models/Customer';

// GET: สร้างรหัสลูกค้าถัดไป (อ้างอิงจากรหัสที่มีอยู่แล้ว)
export async function GET() {
  try {
    await connectDB();
    const code = await (Customer as any).generateUniqueCustomerCode();
    return NextResponse.json({ code });
  } catch (error) {
    console.error('[Customer API] NEXT CODE Error:', error);
    return NextResponse.json(
      { error: 'ไม่สามารถสร้างรหัสลูกค้าใหม่ได้' },
      { status: 500 }
    );
  }
}
