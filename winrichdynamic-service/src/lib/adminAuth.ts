import * as jose from 'jose';
import { cookies } from 'next/headers';

export interface AdminAuthPayload {
  adminId: string;
  phone?: string;
  role?: string;
  roleLevel?: number;
  [key: string]: unknown;
}

export class AdminAuthError extends Error {
  status: number;

  constructor(message: string, status = 401) {
    super(message);
    this.status = status;
  }
}

export async function requireAdminAuth(request: Request): Promise<AdminAuthPayload> {
  const authHeader = request.headers.get('authorization');
  const bearer =
    authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : undefined;
  const cookieToken = (await cookies()).get('b2b_token')?.value;
  const token = bearer || cookieToken;

  if (!token) {
    throw new AdminAuthError('Unauthorized', 401);
  }

  const secret = process.env.JWT_SECRET || 'b2b-winrichdynamic-jwt-secret-2024';
  if (!secret) {
    throw new AdminAuthError('JWT secret not configured', 500);
  }

  try {
    const encoder = new TextEncoder();
    const { payload } = await jose.jwtVerify(token, encoder.encode(secret));
    if (!payload?.adminId) {
      throw new AdminAuthError('Invalid token payload', 401);
    }
    return payload as AdminAuthPayload;
  } catch (error) {
    if (error instanceof AdminAuthError) {
      throw error;
    }
    throw new AdminAuthError('Invalid token', 401);
  }
}
