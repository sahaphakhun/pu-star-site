import { NextRequest, NextResponse } from 'next/server';
import * as jose from 'jose';

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { valid: false, error: 'Token not provided' },
        { status: 401 }
      );
    }

    const token = authHeader.slice(7);
    const secret = process.env.JWT_SECRET;

    if (!secret) {
      console.error('[B2B] JWT_SECRET not configured');
      return NextResponse.json(
        { valid: false, error: 'Server configuration error' },
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
          { valid: false, error: 'Token expired' },
          { status: 401 }
        );
      }

      // ตรวจสอบว่า token มีข้อมูลที่จำเป็นหรือไม่
      if (!payload.adminId || !payload.phone || !payload.role) {
        return NextResponse.json(
          { valid: false, error: 'Invalid token payload' },
          { status: 401 }
        );
      }

      console.log(`[B2B] Token validated for admin: ${payload.adminId}`);
      
      return NextResponse.json({
        valid: true,
        admin: {
          id: payload.adminId,
          phone: payload.phone,
          role: payload.role,
          roleLevel: payload.roleLevel
        }
      });

    } catch (jwtError) {
      console.error('[B2B] JWT verification failed:', jwtError);
      return NextResponse.json(
        { valid: false, error: 'Invalid token' },
        { status: 401 }
      );
    }

  } catch (error) {
    console.error('[B2B] Token validation error:', error);
    return NextResponse.json(
      { valid: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
