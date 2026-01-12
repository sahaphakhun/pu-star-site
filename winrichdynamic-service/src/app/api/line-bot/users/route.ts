import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import LineUser from '@/models/LineUser';
import { requireAdminAuth, AdminAuthError } from '@/lib/adminAuth';

export async function GET(request: Request) {
  try {
    await requireAdminAuth(request);
    await connectDB();

    const users = await LineUser.find().sort({ updatedAt: -1 }).lean();
    return NextResponse.json({ success: true, data: users });
  } catch (error) {
    if (error instanceof AdminAuthError) {
      return NextResponse.json({ success: false, error: error.message }, { status: error.status });
    }
    console.error('[LineBot][Users] GET error:', error);
    return NextResponse.json(
      { success: false, error: 'เกิดข้อผิดพลาดในการดึงผู้ใช้ LINE' },
      { status: 500 }
    );
  }
}
