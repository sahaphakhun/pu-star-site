import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    // สร้าง response สำหรับ logout
    const response = NextResponse.json({
      success: true,
      message: 'ออกจากระบบสำเร็จ'
    });

    // ลบ cookie token
    response.cookies.set('b2b_token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0, // หมดอายุทันที
      path: '/'
    });

    console.log('[B2B] User logged out successfully');
    
    return response;

  } catch (error) {
    console.error('[B2B] Logout error:', error);
    return NextResponse.json(
      { success: false, error: 'เกิดข้อผิดพลาดในการออกจากระบบ' },
      { status: 500 }
    );
  }
}
