import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Order from '@/models/Order';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();
    
    const orderId = params.id;
    
    // ตรวจสอบการยืนยันตัวตน
    const cookieStore = (await cookies()) as any;
    const tokenCookie = cookieStore.get?.('token') || cookieStore.get('token');
    
    if (!tokenCookie) {
      return NextResponse.json({ error: 'กรุณาเข้าสู่ระบบ' }, { status: 401 });
    }
    
    let userId: string;
    try {
      const decoded = jwt.verify(tokenCookie.value, process.env.JWT_SECRET || 'default_secret_replace_in_production') as any;
      userId = decoded.userId;
    } catch (error) {
      return NextResponse.json({ error: 'token ไม่ถูกต้อง' }, { status: 401 });
    }
    
    // ตรวจสอบออเดอร์และสิทธิ์
    const order = await Order.findById(orderId);
    if (!order) {
      return NextResponse.json({ error: 'ไม่พบออเดอร์' }, { status: 404 });
    }
    
    if (order.userId?.toString() !== userId) {
      return NextResponse.json({ error: 'คุณไม่มีสิทธิ์เข้าถึงออเดอร์นี้' }, { status: 403 });
    }
    
    if (order.status !== 'delivered') {
      return NextResponse.json({ error: 'สามารถเคลมได้เฉพาะออเดอร์ที่ส่งสำเร็จแล้ว' }, { status: 400 });
    }
    
    // ตรวจสอบว่ามีการเคลมจริง ๆ หรือไม่ (ต้องมี claimDate หรือ claimReason)
    if (order.claimInfo && (order.claimInfo.claimDate || order.claimInfo.claimReason)) {
      return NextResponse.json({ error: 'ออเดอร์นี้มีการเคลมแล้ว' }, { status: 400 });
    }
    
    // ดึงข้อมูลจาก FormData
    const formData = await request.formData();
    const reason = formData.get('reason') as string;
    
    if (!reason || reason.trim() === '') {
      return NextResponse.json({ error: 'กรุณาระบุเหตุผลในการเคลม' }, { status: 400 });
    }
    
    // รวบรวม URL ของรูปภาพที่อัพโหลดแล้ว
    const claimImages: string[] = [];
    
    // วนลูปหา URL ของรูปภาพ
    for (const [key, value] of formData.entries()) {
      if (key.startsWith('imageUrl_') && typeof value === 'string') {
        claimImages.push(value);
      }
    }
    
    // อัพเดตออเดอร์
    const updatedOrder = await Order.findByIdAndUpdate(
      orderId,
      {
        $set: {
          status: 'claimed',
          claimInfo: {
            claimDate: new Date(),
            claimReason: reason.trim(),
            claimImages,
            claimStatus: 'pending'
          }
        }
      },
      { new: true }
    );
    
    return NextResponse.json(updatedOrder);
    
  } catch (error) {
    console.error('Error processing claim:', error);
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการเคลมสินค้า' },
      { status: 500 }
    );
  }
} 