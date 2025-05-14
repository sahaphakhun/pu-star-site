import { NextResponse } from 'next/server';

export async function POST() {
  try {
    const response = NextResponse.json({
      success: true,
      message: 'ออกจากระบบสำเร็จ',
    });

    // ลบ token cookie โดยการตั้งค่าเวลาหมดอายุในอดีต
    response.cookies.set({
      name: 'token',
      value: '',
      httpOnly: true,
      expires: new Date(0), // ทำให้ cookie หมดอายุทันที
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('เกิดข้อผิดพลาดในการออกจากระบบ:', error);
    return NextResponse.json(
      { success: false, message: 'เกิดข้อผิดพลาดในการออกจากระบบ' },
      { status: 500 }
    );
  }
} 