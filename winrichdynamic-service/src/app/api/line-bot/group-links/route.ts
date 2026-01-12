import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import LineGroupLink from '@/models/LineGroupLink';
import Customer from '@/models/Customer';
import { requireAdminAuth, AdminAuthError } from '@/lib/adminAuth';

export async function GET(request: Request) {
  try {
    await requireAdminAuth(request);
    await connectDB();

    const links = await LineGroupLink.find().sort({ updatedAt: -1 }).lean();
    const customerIds = links.map((link: any) => link.customerId).filter(Boolean);
    const customers = await Customer.find(
      { _id: { $in: customerIds } },
      { name: 1, customerCode: 1 }
    ).lean();

    const customerMap = new Map(
      customers.map((customer: any) => [String(customer._id), customer])
    );

    const data = links.map((link: any) => {
      const customer = customerMap.get(String(link.customerId));
      return {
        ...link,
        customerName: customer?.name || '',
        customerCode: customer?.customerCode || '',
      };
    });

    return NextResponse.json({ success: true, data });
  } catch (error) {
    if (error instanceof AdminAuthError) {
      return NextResponse.json({ success: false, error: error.message }, { status: error.status });
    }
    console.error('[LineBot][GroupLinks] GET error:', error);
    return NextResponse.json(
      { success: false, error: 'เกิดข้อผิดพลาดในการดึงข้อมูลการผูกกลุ่ม' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    await requireAdminAuth(request);
    await connectDB();

    const body = await request.json();
    const groupId = String(body.groupId || '').trim();
    const customerCode = String(body.customerCode || '').trim();
    const customerId = String(body.customerId || '').trim();

    if (!groupId) {
      return NextResponse.json(
        { success: false, error: 'กรุณาระบุ LINE groupId' },
        { status: 400 }
      );
    }

    let resolvedCustomerId = customerId;
    if (!resolvedCustomerId && customerCode) {
      const customer = await Customer.findOne({ customerCode: customerCode.toUpperCase() });
      if (!customer) {
        return NextResponse.json(
          { success: false, error: 'ไม่พบลูกค้าตามรหัสที่ระบุ' },
          { status: 404 }
        );
      }
      resolvedCustomerId = String(customer._id);
    }

    if (!resolvedCustomerId) {
      return NextResponse.json(
        { success: false, error: 'กรุณาระบุ customerId หรือ customerCode' },
        { status: 400 }
      );
    }

    const link = await LineGroupLink.findOneAndUpdate(
      { groupId },
      { groupId, customerId: resolvedCustomerId },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    return NextResponse.json({ success: true, data: link });
  } catch (error) {
    if (error instanceof AdminAuthError) {
      return NextResponse.json({ success: false, error: error.message }, { status: error.status });
    }
    console.error('[LineBot][GroupLinks] POST error:', error);
    return NextResponse.json(
      { success: false, error: 'เกิดข้อผิดพลาดในการบันทึกการผูกกลุ่ม' },
      { status: 500 }
    );
  }
}
