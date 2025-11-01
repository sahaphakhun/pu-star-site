import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/models/User';
import { verifyToken } from '@/lib/auth';

// ดึงรายการที่อยู่
export async function GET(request: NextRequest) {
  try {
    const authResult = await verifyToken(request);
    
    if (!authResult.valid) {
      return NextResponse.json({ error: 'ไม่มีสิทธิ์เข้าถึง' }, { status: 401 });
    }

    await connectDB();
    
    const user = await User.findById(authResult.decoded.userId)
      .select('addresses')
      .lean();

    if (!user) {
      return NextResponse.json({ error: 'ไม่พบผู้ใช้' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: user.addresses || []
    });

  } catch (error) {
    console.error('Error fetching addresses:', error);
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการดึงข้อมูลที่อยู่' },
      { status: 500 }
    );
  }
}

// เพิ่มที่อยู่ใหม่
export async function POST(request: NextRequest) {
  try {
    const authResult = await verifyToken(request);
    
    if (!authResult.valid) {
      return NextResponse.json({ error: 'ไม่มีสิทธิ์เข้าถึง' }, { status: 401 });
    }

    await connectDB();
    
    const { label, address, isDefault } = await request.json();

    if (!label || !address) {
      return NextResponse.json({ error: 'ต้องระบุชื่อและที่อยู่' }, { status: 400 });
    }

    const user = await User.findById(authResult.decoded.userId);

    if (!user) {
      return NextResponse.json({ error: 'ไม่พบผู้ใช้' }, { status: 404 });
    }

    // ถ้าเป็นที่อยู่เริ่มต้น ให้ยกเลิกที่อยู่เริ่มต้นเดิม
    if (isDefault) {
      user.addresses?.forEach(addr => {
        addr.isDefault = false;
      });
    }

    // เพิ่มที่อยู่ใหม่
    user.addresses = user.addresses || [];
    user.addresses.push({
      label,
      address,
      isDefault: isDefault || false
    });

    await user.save();

    return NextResponse.json({
      success: true,
      data: user.addresses
    });

  } catch (error) {
    console.error('Error adding address:', error);
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการเพิ่มที่อยู่' },
      { status: 500 }
    );
  }
}

// ลบที่อยู่
export async function DELETE(request: NextRequest) {
  try {
    const authResult = await verifyToken(request);
    
    if (!authResult.valid) {
      return NextResponse.json({ error: 'ไม่มีสิทธิ์เข้าถึง' }, { status: 401 });
    }

    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const addressId = searchParams.get('id');

    if (!addressId) {
      return NextResponse.json({ error: 'ต้องระบุรหัสที่อยู่' }, { status: 400 });
    }

    const user = await User.findById(authResult.decoded.userId);

    if (!user) {
      return NextResponse.json({ error: 'ไม่พบผู้ใช้' }, { status: 404 });
    }

    // ลบที่อยู่
    user.addresses = user.addresses?.filter(addr => addr._id?.toString() !== addressId) || [];

    await user.save();

    return NextResponse.json({
      success: true,
      data: user.addresses
    });

  } catch (error) {
    console.error('Error deleting address:', error);
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการลบที่อยู่' },
      { status: 500 }
    );
  }
} 