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
    
    if (order.claimInfo) {
      return NextResponse.json({ error: 'ออเดอร์นี้มีการเคลมแล้ว' }, { status: 400 });
    }
    
    // ดึงข้อมูลจาก FormData
    const formData = await request.formData();
    const reason = formData.get('reason') as string;
    
    if (!reason || reason.trim() === '') {
      return NextResponse.json({ error: 'กรุณาระบุเหตุผลในการเคลม' }, { status: 400 });
    }
    
    // อัพโหลดรูปภาพ (ถ้ามี)
    const claimImages: string[] = [];
    
    // วนลูปหารูปภาพที่อัพโหลด
    for (const [key, value] of formData.entries()) {
      if (key.startsWith('image_') && value instanceof File) {
        try {
          // ในที่นี้ควรมีการอัพโหลดไฟล์จริง เช่น ไปยัง cloud storage
          // สำหรับตัวอย่างนี้ เราจะใช้ data URL
          const buffer = await value.arrayBuffer();
          const base64 = Buffer.from(buffer).toString('base64');
          const dataUrl = `data:${value.type};base64,${base64}`;
          claimImages.push(dataUrl);
        } catch (error) {
          console.error('Error processing image:', error);
        }
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