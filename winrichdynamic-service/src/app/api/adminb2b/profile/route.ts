import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Admin from '@/models/Admin';
import * as jose from 'jose';

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    // ตรวจสอบ JWT token จาก Authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: 'Token not provided' },
        { status: 401 }
      );
    }

    const token = authHeader.slice(7);
    const secret = process.env.JWT_SECRET;

    if (!secret) {
      console.error('[B2B] JWT_SECRET not configured');
      return NextResponse.json(
        { success: false, error: 'Server configuration error' },
        { status: 500 }
      );
    }

    try {
      // ตรวจสอบ JWT token
      const encoder = new TextEncoder();
      const { payload } = await jose.jwtVerify(token, encoder.encode(secret));
      
      // ตรวจสอบว่า token หมดอายุหรือไม่
      const currentTime = Math.floor(Date.now() / 1000);
      if (payload.exp && payload.exp < currentTime) {
        return NextResponse.json(
          { success: false, error: 'Token expired' },
          { status: 401 }
        );
      }

      // ตรวจสอบว่า token มีข้อมูลที่จำเป็นหรือไม่
      if (!payload.adminId || !payload.phone || !payload.role) {
        return NextResponse.json(
          { success: false, error: 'Invalid token payload' },
          { status: 401 }
        );
      }

      // ค้นหา admin จาก database
      const admin = await Admin.findById(payload.adminId).populate('role', 'name level');
      if (!admin) {
        return NextResponse.json(
          { success: false, error: 'Admin not found' },
          { status: 404 }
        );
      }

      // ตรวจสอบว่า admin ยังใช้งานได้หรือไม่
      if (!admin.isActive) {
        return NextResponse.json(
          { success: false, error: 'Account is deactivated' },
          { status: 403 }
        );
      }

      console.log(`[B2B] Profile accessed for admin: ${admin.name}`);

      return NextResponse.json({
        success: true,
        message: 'Profile retrieved successfully',
        data: {
          id: admin._id,
          name: admin.name,
          phone: admin.phone,
          email: admin.email,
          company: admin.company,
          role: admin.role.name,
          roleLevel: admin.role.level,
          lastLoginAt: admin.lastLoginAt,
          createdAt: admin.createdAt,
          updatedAt: admin.updatedAt
        }
      });

    } catch (jwtError) {
      console.error('[B2B] JWT verification failed:', jwtError);
      return NextResponse.json(
        { success: false, error: 'Invalid token' },
        { status: 401 }
      );
    }

  } catch (error) {
    console.error('[B2B] Profile API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
