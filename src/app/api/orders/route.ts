import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Order from '@/models/Order';
import User from '@/models/User';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import { sendSMS } from '@/utils/deesmsx';
import { orderInputSchema } from '@schemas/order';
import AdminPhone from '@/models/AdminPhone';
import { updateUserNameFromOrder } from '@/utils/userNameSync';

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

    // pagination & search
    const page = Number(searchParams.get('page') || '1');
    const limit = Math.min(Number(searchParams.get('limit') || '20'), 100);
    const q = searchParams.get('q') || '';
    const status = searchParams.get('status');

    if (q) {
      query = {
        ...query,
        $or: [
          { customerName: { $regex: q, $options: 'i' } },
          { customerPhone: { $regex: q, $options: 'i' } },
          { _id: { $regex: q, $options: 'i' } },
        ],
      } as any;
    }
    if (status) {
      query = { ...query, status } as any;
    }

    const total = await Order.countDocuments(query);
    const orders = await Order.find(query)
      .sort({ orderDate: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    const hasPaginationParam = searchParams.has('page') || searchParams.has('limit') || searchParams.has('q') || searchParams.has('status');
    if (!hasPaginationParam && !startDate && !endDate) {
      return NextResponse.json({ orders });
    }

    return NextResponse.json({ orders: orders, total, page, limit, totalPages: Math.ceil(total / limit) });
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
    const raw = await request.json();

    // ดึง token เพื่อหา userId และเบอร์โทรหากไม่ส่งมา
    const cookieStore = (await cookies()) as any;
    const tokenCookie = cookieStore.get?.('token') || cookieStore.get('token');

    let userId: string | undefined;
    if (tokenCookie) {
      try {
        const decoded = jwt.verify(tokenCookie.value, process.env.JWT_SECRET || 'default_secret_replace_in_production') as any;
        userId = decoded.userId;
        if (!raw.customerPhone) raw.customerPhone = decoded.phoneNumber;
      } catch {}
    }

    const parsed = orderInputSchema.safeParse(raw);
    if (!parsed.success) {
      console.error('Order validation failed:', parsed.error.errors);
      console.error('Raw data received:', JSON.stringify(raw, null, 2));
      return NextResponse.json({ error: 'รูปแบบข้อมูลไม่ถูกต้อง', details: parsed.error.errors }, { status: 400 });
    }
    const data = parsed.data;

    await connectDB();

    const order = await Order.create({
      ...data,
      customerPhone: data.customerPhone,
      orderDate: new Date(),
      ...(userId && { userId })
    });

    // ตรวจสอบสต็อกผ่าน WMS อัตโนมัติหลังจากสร้างออเดอร์
    try {
      const stockCheckResponse = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/wms/stock-check`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderId: order._id.toString()
        })
      });

      if (stockCheckResponse.ok) {
        const stockResult = await stockCheckResponse.json();
        console.log('WMS Stock Check Result:', stockResult);
        
        // ถ้าสต็อกไม่เพียงพอ ให้เปลี่ยนสถานะออเดอร์เป็น pending และแจ้งเตือน
        if (stockResult.overallStatus === 'insufficient') {
          await Order.findByIdAndUpdate(order._id, {
            status: 'pending',
            'wmsData.stockCheckStatus': 'insufficient'
          });
          console.warn('Order created but stock insufficient:', order._id);
        }
      } else {
        console.error('Failed to check stock via WMS:', await stockCheckResponse.text());
      }
    } catch (error) {
      console.error('Error checking stock via WMS:', error);
      // ไม่ให้ error ในการตรวจสอบสต็อกไปกระทบการสร้างออเดอร์
    }

    // อัปเดตชื่อผู้ใช้จากออเดอร์หากยังไม่ได้ตั้งชื่อ
    if (userId && data.customerName) {
      try {
        await updateUserNameFromOrder(userId, data.customerName);
      } catch (error) {
        console.error('เกิดข้อผิดพลาดในการอัปเดตชื่อผู้ใช้:', error);
      }
    }

    // บันทึกข้อมูลใบกำกับภาษีอัตโนมัติถ้าลูกค้าขอใบกำกับภาษีและยังไม่มีข้อมูลบันทึกไว้
    if (userId && data.taxInvoice?.requestTaxInvoice && data.taxInvoice.companyName && data.taxInvoice.taxId) {
      try {
        const user = await User.findById(userId);
        if (user && !user.taxInvoiceInfo) {
          user.taxInvoiceInfo = {
            companyName: data.taxInvoice.companyName,
            taxId: data.taxInvoice.taxId,
            companyAddress: data.taxInvoice.companyAddress || '',
            companyPhone: data.taxInvoice.companyPhone || '',
            companyEmail: data.taxInvoice.companyEmail || ''
          };
          await user.save();
        }
      } catch (error) {
        console.error('เกิดข้อผิดพลาดในการบันทึกข้อมูลใบกำกับภาษี:', error);
      }
    }

    // ส่งการแจ้งเตือนผ่านทั้ง SMS และ Messenger
    try {
      const orderNumber = order._id.toString().slice(-8).toUpperCase();
      const origin = request.headers.get('origin') || process.env.NEXT_PUBLIC_SITE_URL || '';
      const orderUrl = `${origin}/my-orders`;
      
      // Import ฟังก์ชันแบบ dynamic เพื่อหลีกเลี่ยง dependency issues
      const { sendDualOrderConfirmation } = await import('@/app/notification/dualNotification');
      
      await sendDualOrderConfirmation(data.customerPhone, orderNumber, data.totalAmount);
    } catch (notificationErr) {
      console.error('ส่งการแจ้งเตือนล้มเหลว:', notificationErr);
      
      // Fallback ส่ง SMS อย่างเดียวถ้าระบบ dual notification มีปัญหา
      try {
        const orderNumber = order._id.toString().slice(-8).toUpperCase();
        const origin = request.headers.get('origin') || process.env.NEXT_PUBLIC_SITE_URL || '';
        const orderUrl = `${origin}/my-orders`;
        const smsMessage = `ขอบคุณสำหรับการสั่งซื้อ #${orderNumber} ยอดรวม ${data.totalAmount.toLocaleString()} บาท\nตรวจสอบรายละเอียดที่ ${orderUrl}`;
        await sendSMS(data.customerPhone, smsMessage);
      } catch (smsErr) {
        console.error('ส่ง SMS แจ้งเตือนล้มเหลว:', smsErr);
      }
    }

    // แจ้งเตือนแอดมินทุกคน
    try {
      const adminList = await AdminPhone.find({}, 'phoneNumber').lean();
      const adminMsg = `มีออเดอร์ใหม่ #${order._id.toString().slice(-8).toUpperCase()} ยอดรวม ${data.totalAmount.toLocaleString()} บาท`; 
      await Promise.allSettled(adminList.map((a:any)=> sendSMS(a.phoneNumber, adminMsg)));
    } catch (err){
      console.error('ส่ง SMS แจ้งแอดมินล้มเหลว:', err);
    }

    return NextResponse.json(order, { status: 201 });
  } catch (error) {
    console.error('Error creating order:', error);
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการสร้างคำสั่งซื้อ' },
      { status: 500 }
    );
  }
} 