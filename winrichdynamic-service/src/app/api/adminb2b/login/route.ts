import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json();
    if (!token) return NextResponse.json({ error: 'missing token' }, { status: 400 });
    const res = NextResponse.json({ ok: true });
    res.cookies.set('b2b_token', token, { httpOnly: true, path: '/', sameSite: 'lax' });
    return res;
  } catch (error) {
    return NextResponse.json({ error: 'login failed' }, { status: 500 });
  }
}


