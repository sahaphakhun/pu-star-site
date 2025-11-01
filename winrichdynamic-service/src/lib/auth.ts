import { NextRequest } from 'next/server';
import * as jose from 'jose';

interface AuthResult {
  valid: boolean;
  adminId?: string;
  phone?: string;
  role?: string;
  roleLevel?: number;
  error?: string;
}

export function verifyToken(request: NextRequest): AuthResult {
  try {
    console.log('[B2B] verifyToken - Starting verification');
    
    const authHeader = request.headers.get('authorization');
    console.log('[B2B] Authorization header:', authHeader);
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('[B2B] No or invalid authorization header');
      return { valid: false, error: 'No authorization header' };
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    console.log('[B2B] Token extracted:', token ? `${token.substring(0, 20)}...` : 'empty');
    
    if (!token) {
      console.log('[B2B] No token provided');
      return { valid: false, error: 'No token provided' };
    }

    // ใช้ JWT secret เดียวกับที่สร้าง token
    const secret = process.env.JWT_SECRET || 'b2b-winrichdynamic-jwt-secret-2024';
    
    try {
      // ตรวจสอบ token ด้วย jose
      const payload = jose.decodeJwt(token);
      
      // ตรวจสอบว่า token หมดอายุหรือไม่
      if (payload.exp && Date.now() >= payload.exp * 1000) {
        return { valid: false, error: 'Token expired' };
      }

      // ตรวจสอบ payload
      if (!payload.adminId || !payload.phone || !payload.role) {
        return { valid: false, error: 'Invalid token payload' };
      }

      return {
        valid: true,
        adminId: payload.adminId as string,
        phone: payload.phone as string,
        role: payload.role as string,
        roleLevel: payload.roleLevel as number
      };

    } catch (jwtError) {
      console.error('[B2B] JWT verification error:', jwtError);
      return { valid: false, error: 'Invalid token' };
    }

  } catch (error) {
    console.error('[B2B] Token verification error:', error);
    return { valid: false, error: 'Token verification failed' };
  }
}

// ฟังก์ชันสำหรับตรวจสอบสิทธิ์
export function checkPermission(auth: AuthResult, requiredPermission: string): boolean {
  if (!auth.valid || !auth.role || !auth.roleLevel) return false;
  
  // ตรวจสอบสิทธิ์ตาม role level
  if (auth.role === 'superadmin') return true;
  if (auth.role === 'admin' && auth.roleLevel <= 1) return true;
  if (auth.role === 'manager' && auth.roleLevel <= 2) return true;
  if (auth.role === 'staff' && auth.roleLevel <= 3) return true;
  
  return false;
}


