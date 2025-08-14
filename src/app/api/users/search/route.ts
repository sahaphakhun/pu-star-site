import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import User from '@/models/User';

// GET: ค้นหาผู้ใช้สำหรับการ mapping
export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();
    
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';
    const limit = parseInt(searchParams.get('limit') || '20');
    
    if (!query.trim()) {
      return NextResponse.json({
        success: true,
        data: []
      });
    }
    
    // ค้นหาผู้ใช้ตามชื่อหรือเบอร์โทรศัพท์
    const users = await User.find({
      $or: [
        { name: { $regex: query, $options: 'i' } },
        { phoneNumber: { $regex: query, $options: 'i' } },
        { email: { $regex: query, $options: 'i' } }
      ]
    })
    .select('_id name phoneNumber email customerType totalOrders totalSpent lastOrderDate')
    .sort({ totalOrders: -1, lastOrderDate: -1 })
    .limit(limit);
    
    return NextResponse.json({
      success: true,
      data: users
    });
    
  } catch (error) {
    console.error('Error in user search API:', error);
    return NextResponse.json(
      { success: false, error: 'เกิดข้อผิดพลาดในการค้นหา' },
      { status: 500 }
    );
  }
}
