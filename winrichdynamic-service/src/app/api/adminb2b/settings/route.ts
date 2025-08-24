import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Settings from '@/models/Settings';

export async function GET() {
  try {
    await connectDB();
    
    // ดึงการตั้งค่าจาก MongoDB หรือสร้างใหม่ถ้ายังไม่มี
    let settings = await Settings.findOne();
    
    if (!settings) {
      // สร้างการตั้งค่าเริ่มต้นถ้ายังไม่มี
      settings = await Settings.create({});
    }
    
    return NextResponse.json({
      success: true,
      data: settings
    });
  } catch (error) {
    console.error('Error fetching settings:', error);
    return NextResponse.json(
      { success: false, error: 'เกิดข้อผิดพลาดในการดึงข้อมูลการตั้งค่า' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const body = await request.json();
    
    // อัปเดตการตั้งค่าใน MongoDB
    const settings = await Settings.findOneAndUpdate(
      {}, // ค้นหา record แรก (เพราะมี unique index)
      body,
      { 
        upsert: true, // สร้างใหม่ถ้ายังไม่มี
        new: true, // ส่งคืนข้อมูลที่อัปเดตแล้ว
        runValidators: true // รัน validation
      }
    );
    
    return NextResponse.json({
      success: true,
      message: 'บันทึกการตั้งค่าเรียบร้อยแล้ว',
      data: settings
    });
  } catch (error) {
    console.error('Error saving settings:', error);
    return NextResponse.json(
      { success: false, error: 'เกิดข้อผิดพลาดในการบันทึกการตั้งค่า' },
      { status: 500 }
    );
  }
}
