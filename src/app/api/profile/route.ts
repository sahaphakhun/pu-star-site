import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/models/User';
import { verifyToken } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const authResult = await verifyToken(request);
    
    if (!authResult.valid) {
      return NextResponse.json({ error: 'ไม่มีสิทธิ์เข้าถึง' }, { status: 401 });
    }

    await connectDB();
    
    const user = await User.findById(authResult.decoded.userId)
      .select('-password')
      .lean();

    if (!user) {
      return NextResponse.json({ error: 'ไม่พบผู้ใช้' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: user
    });

  } catch (error) {
    console.error('Error fetching profile:', error);
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการดึงข้อมูลโปรไฟล์' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const authResult = await verifyToken(request);
    
    if (!authResult.valid) {
      return NextResponse.json({ error: 'ไม่มีสิทธิ์เข้าถึง' }, { status: 401 });
    }

    await connectDB();
    
    const { name, phoneNumber, email, profileImageUrl } = await request.json();

    // ตรวจสอบว่าอีเมลซ้ำกับผู้ใช้อื่นหรือไม่
    if (email) {
      const existingUser = await User.findOne({ 
        email, 
        _id: { $ne: authResult.decoded.userId } 
      });
      
      if (existingUser) {
        return NextResponse.json({ error: 'อีเมลนี้มีผู้ใช้แล้ว' }, { status: 400 });
      }
    }

    // ตรวจสอบว่าเบอร์โทรซ้ำกับผู้ใช้อื่นหรือไม่
    if (phoneNumber) {
      const existingUser = await User.findOne({ 
        phoneNumber, 
        _id: { $ne: authResult.decoded.userId } 
      });
      
      if (existingUser) {
        return NextResponse.json({ error: 'เบอร์โทรนี้มีผู้ใช้แล้ว' }, { status: 400 });
      }
    }

    const updatedUser = await User.findByIdAndUpdate(
      authResult.decoded.userId,
      { 
        ...(name && { name }),
        ...(phoneNumber && { phoneNumber }),
        ...(email && { email }),
        ...(profileImageUrl !== undefined && { profileImageUrl })
      },
      { new: true, runValidators: true }
    ).select('-password');

    if (!updatedUser) {
      return NextResponse.json({ error: 'ไม่พบผู้ใช้' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: updatedUser
    });

  } catch (error) {
    console.error('Error updating profile:', error);
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการอัปเดตโปรไฟล์' },
      { status: 500 }
    );
  }
} 