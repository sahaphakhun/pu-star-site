import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import User from '@/models/User';

// ฟังก์ชันตรวจสอบว่าเป็นแอดมินหรือไม่
async function isAdmin(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return false;
    }

    const adminPhone = request.headers.get('x-admin-phone');
    if (adminPhone) {
      await connectDB();
      const admin = await User.findOne({ phoneNumber: adminPhone, role: 'admin' });
      return !!admin;
    }

    return false;
  } catch (error) {
    console.error('Error checking admin status:', error);
    return false;
  }
}

// GET - ค้นหาผู้ใช้ด้วยเบอร์โทรศัพท์
export async function GET(request: NextRequest) {
  try {
    if (!(await isAdmin(request))) {
      return NextResponse.json(
        { success: false, message: 'ไม่มีสิทธิ์เข้าถึง' },
        { status: 403 }
      );
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';
    const limit = parseInt(searchParams.get('limit') || '10');

    if (!query || query.length < 3) {
      return NextResponse.json({
        success: true,
        data: [],
        message: 'กรุณาระบุคำค้นหาอย่างน้อย 3 ตัวอักษร',
      });
    }

    // ค้นหาผู้ใช้ด้วยเบอร์โทรศัพท์หรือชื่อ และไม่ใช่แอดมิน
    const searchQuery = {
      $and: [
        { role: { $ne: 'admin' } }, // ไม่ใช่แอดมิน
        {
          $or: [
            { phoneNumber: { $regex: query, $options: 'i' } },
            { name: { $regex: query, $options: 'i' } },
            { email: { $regex: query, $options: 'i' } },
          ]
        }
      ]
    };

    const users = await User.find(searchQuery)
      .select('phoneNumber name email profileImageUrl customerType totalOrders totalSpent lastOrderDate')
      .sort({ lastOrderDate: -1, createdAt: -1 })
      .limit(limit)
      .lean();

    // เพิ่มข้อมูลเพิ่มเติม
    const result = users.map(user => ({
      phoneNumber: user.phoneNumber,
      name: user.name || 'ไม่ระบุชื่อ',
      email: user.email || '',
      profileImageUrl: user.profileImageUrl || '',
      customerType: user.customerType || 'new',
      totalOrders: user.totalOrders || 0,
      totalSpent: user.totalSpent || 0,
      lastOrderDate: user.lastOrderDate,
      displayText: `${user.name || 'ไม่ระบุชื่อ'} (${user.phoneNumber})`,
    }));

    return NextResponse.json({
      success: true,
      data: result,
    });

  } catch (error) {
    console.error('Error searching users:', error);
    return NextResponse.json(
      { success: false, message: 'เกิดข้อผิดพลาดในการค้นหาผู้ใช้' },
      { status: 500 }
    );
  }
} 