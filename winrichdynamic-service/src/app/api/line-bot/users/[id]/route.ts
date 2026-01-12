import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import LineUser from '@/models/LineUser';
import { requireAdminAuth, AdminAuthError } from '@/lib/adminAuth';

export async function PATCH(request: Request, context: { params: { id: string } }) {
  try {
    await requireAdminAuth(request);
    await connectDB();

    const body = await request.json();
    const updates: Record<string, any> = {};

    if (typeof body.displayName === 'string') updates.displayName = body.displayName.trim();
    if (typeof body.canIssueQuotation === 'boolean') updates.canIssueQuotation = body.canIssueQuotation;
    if (typeof body.isActive === 'boolean') updates.isActive = body.isActive;

    const user = await LineUser.findByIdAndUpdate(
      context.params.id,
      { $set: updates },
      { new: true }
    );

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'ไม่พบผู้ใช้ LINE ที่ต้องการแก้ไข' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: user });
  } catch (error) {
    if (error instanceof AdminAuthError) {
      return NextResponse.json({ success: false, error: error.message }, { status: error.status });
    }
    console.error('[LineBot][Users] PATCH error:', error);
    return NextResponse.json(
      { success: false, error: 'เกิดข้อผิดพลาดในการแก้ไขผู้ใช้ LINE' },
      { status: 500 }
    );
  }
}
