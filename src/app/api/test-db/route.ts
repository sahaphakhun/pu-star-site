import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Order from '@/models/Order';
import User from '@/models/User';

export async function GET(request: NextRequest) {
  try {
    // เชื่อมต่อฐานข้อมูล
    await connectDB();
    
    // ทดสอบการเข้าถึง Models
    let orderModelStatus = 'Not Accessible';
    let userModelStatus = 'Not Accessible';
    let ordersCount = 0;
    let usersCount = 0;
    
    try {
      // ทดสอบ Order Model
      ordersCount = await Order.countDocuments();
      orderModelStatus = 'Accessible';
    } catch (error) {
      console.error('Order Model Error:', error);
      orderModelStatus = 'Error';
    }
    
    try {
      // ทดสอบ User Model
      usersCount = await User.countDocuments();
      userModelStatus = 'Accessible';
    } catch (error) {
      console.error('User Model Error:', error);
      userModelStatus = 'Error';
    }
    
    const response = {
      success: true,
      data: {
        database: 'Connected',
        models: {
          Order: orderModelStatus,
          User: userModelStatus
        },
        counts: {
          orders: ordersCount,
          users: usersCount
        }
      }
    };
    
    return NextResponse.json(response);
    
  } catch (error) {
    console.error('Database Test Error:', error);
    
    return NextResponse.json({
      success: false,
      error: 'ไม่สามารถเชื่อมต่อฐานข้อมูลได้',
      data: {
        database: 'Disconnected',
        models: {
          Order: 'Not Accessible',
          User: 'Not Accessible'
        },
        counts: {
          orders: 0,
          users: 0
        }
      }
    }, { status: 500 });
  }
}
