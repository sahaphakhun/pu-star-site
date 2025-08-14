import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import User from '@/models/User';

// GET: ค้นหาผู้ใช้สำหรับการ mapping
export async function GET(request: NextRequest) {
  try {
    console.log('[API] Starting user search request');
    
    await connectToDatabase();
    console.log('[API] Database connected successfully');
    
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';
    const limit = parseInt(searchParams.get('limit') || '20');
    
    console.log('[API] Search query:', query, 'Limit:', limit);
    
    if (!query.trim()) {
      console.log('[API] Empty query, returning empty results');
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
    
    console.log('[API] Found users:', users.length);
    
    return NextResponse.json({
      success: true,
      data: users
    });
    
  } catch (error) {
    console.error('[API] Error in user search API:', error);
    
    // ส่ง error response ที่มีรายละเอียดมากขึ้น
    if (error instanceof Error) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'เกิดข้อผิดพลาดในการค้นหา',
          details: error.message,
          stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { success: false, error: 'เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ' },
      { status: 500 }
    );
  }
}
