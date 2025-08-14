import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import Order from '@/models/Order';
import User from '@/models/User';

// GET: ทดสอบการเชื่อมต่อฐานข้อมูล
export async function GET(request: NextRequest) {
  try {
    console.log('[API] Starting database connection test');
    
    // ทดสอบการเชื่อมต่อฐานข้อมูล
    await connectToDatabase();
    console.log('[API] Database connected successfully');
    
    // ทดสอบการเข้าถึง models
    const orderCount = await Order.countDocuments();
    const userCount = await User.countDocuments();
    
    console.log('[API] Model access test successful:', { orderCount, userCount });
    
    return NextResponse.json({
      success: true,
      message: 'การเชื่อมต่อฐานข้อมูลสำเร็จ',
      data: {
        database: 'Connected',
        models: {
          Order: 'Accessible',
          User: 'Accessible'
        },
        counts: {
          orders: orderCount,
          users: userCount
        }
      }
    });
    
  } catch (error) {
    console.error('[API] Database connection test failed:', error);
    
    // ส่ง error response ที่มีรายละเอียดมากขึ้น
    if (error instanceof Error) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'การเชื่อมต่อฐานข้อมูลล้มเหลว',
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
