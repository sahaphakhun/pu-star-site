import { NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';

export function verifyToken(request: NextRequest) {
  try {
    const auth = request.headers.get('authorization') || '';
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
    if (!token) return { valid: false };
    const secret = process.env.JWT_SECRET as string;
    if (!secret) return { valid: false };
    const payload = jwt.verify(token, secret);
    return { valid: true, payload } as const;
  } catch {
    return { valid: false } as const;
  }
}


