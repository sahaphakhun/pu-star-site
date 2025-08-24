import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const response = NextResponse.json({ 
      success: true, 
      message: 'ออกจากระบบเรียบร้อยแล้ว' 
    });

    // ลบ cookie
    response.cookies.delete('b2b_token');

    return response;
  } catch (error) {
    console.error('[B2B] Logout error:', error);
    return NextResponse.json(
      { success: false, error: 'เกิดข้อผิดพลาดในการออกจากระบบ' },
      { status: 500 }
    );
  }
}
