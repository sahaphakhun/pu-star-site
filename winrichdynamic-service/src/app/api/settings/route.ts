import { NextResponse } from 'next/server';
import * as jose from 'jose';
import { cookies } from 'next/headers';
import connectDB from '@/lib/mongodb';
import { Settings } from '@/models/Settings';

// GET: ดึงข้อมูลการตั้งค่าระบบ
export async function GET(request: Request) {
  try {
    await connectDB();
    
    // Check authentication (only admin can access settings)
    try {
      const authHeader = (request.headers as any).get?.('authorization') as string | null;
      const bearer = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : undefined;
      const cookieToken = (await cookies()).get('b2b_token')?.value;
      const token = bearer || cookieToken;
      
      if (!token) {
        return NextResponse.json(
          { error: 'กรุณาเข้าสู่ระบบก่อนใช้งาน' },
          { status: 401 }
        );
      }
      
      const payload: any = jose.decodeJwt(token);
      const roleName = String(payload.role || '').toLowerCase();
      
      if (roleName !== 'admin') {
        return NextResponse.json(
          { error: 'ไม่มีสิทธิ์ในการเข้าถึงการตั้งค่าระบบ' },
          { status: 403 }
        );
      }
    } catch (error) {
      console.error('[Settings API] Authentication error:', error);
      return NextResponse.json(
        { error: 'การตรวจสอบสิทธิ์ผิดพลาด' },
        { status: 401 }
      );
    }

    // Get settings (there should be only one document)
    let settings = await Settings.findOne({});
    
    // If no settings exist, create default settings
    if (!settings) {
      settings = await Settings.create({});
    }

    return NextResponse.json(settings);
    
  } catch (error) {
    console.error('[Settings API] GET Error:', error);
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการดึงข้อมูลการตั้งค่า' },
      { status: 500 }
    );
  }
}

// PUT: อัปเดตข้อมูลการตั้งค่าระบบ
export async function PUT(request: Request) {
  try {
    await connectDB();
    
    // Check authentication (only admin can update settings)
    try {
      const authHeader = (request.headers as any).get?.('authorization') as string | null;
      const bearer = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : undefined;
      const cookieToken = (await cookies()).get('b2b_token')?.value;
      const token = bearer || cookieToken;
      
      if (!token) {
        return NextResponse.json(
          { error: 'กรุณาเข้าสู่ระบบก่อนใช้งาน' },
          { status: 401 }
        );
      }
      
      const payload: any = jose.decodeJwt(token);
      const roleName = String(payload.role || '').toLowerCase();
      
      if (roleName !== 'admin') {
        return NextResponse.json(
          { error: 'ไม่มีสิทธิ์ในการแก้ไขการตั้งค่าระบบ' },
          { status: 403 }
        );
      }
    } catch (error) {
      console.error('[Settings API] Authentication error:', error);
      return NextResponse.json(
        { error: 'การตรวจสอบสิทธิ์ผิดพลาด' },
        { status: 401 }
      );
    }

    const updateData = await request.json();
    
    // Validate input data
    if (!updateData || typeof updateData !== 'object') {
      return NextResponse.json(
        { error: 'รูปแบบข้อมูลไม่ถูกต้อง' },
        { status: 400 }
      );
    }

    // Get existing settings
    let settings = await Settings.findOne({});
    
    if (!settings) {
      // Create new settings if none exist
      settings = await Settings.create(updateData);
    } else {
      // Update existing settings
      settings = await Settings.findByIdAndUpdate(
        settings._id,
        { ...updateData, updatedAt: new Date() },
        { new: true, runValidators: true }
      );
    }

    return NextResponse.json(settings);
    
  } catch (error) {
    console.error('[Settings API] PUT Error:', error);
    
    if (error instanceof Error && error.name === 'ValidationError') {
      return NextResponse.json(
        { error: 'ข้อมูลไม่ถูกต้องตามเงื่อนไขที่กำหนด', details: error.message },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการอัปเดตข้อมูลการตั้งค่า' },
      { status: 500 }
    );
  }
}