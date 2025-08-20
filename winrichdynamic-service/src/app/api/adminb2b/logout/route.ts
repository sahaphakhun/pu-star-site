import { NextRequest, NextResponse } from 'next/server';

export async function POST(_request: NextRequest) {
  const res = NextResponse.json({ ok: true });
  res.cookies.set('b2b_token', '', { httpOnly: true, path: '/', maxAge: 0 });
  return res;
}


