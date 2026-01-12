import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import LineGroupLink from '@/models/LineGroupLink';
import { requireAdminAuth, AdminAuthError } from '@/lib/adminAuth';

export async function DELETE(request: Request, context: { params: { id: string } }) {
  try {
    await requireAdminAuth(request);
    await connectDB();

    const deleted = await LineGroupLink.findByIdAndDelete(context.params.id);
    if (!deleted) {
      return NextResponse.json(
        { success: false, error: 'ไม่พบการผูกกลุ่มที่ต้องการลบ' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof AdminAuthError) {
      return NextResponse.json({ success: false, error: error.message }, { status: error.status });
    }
    console.error('[LineBot][GroupLinks] DELETE error:', error);
    return NextResponse.json(
      { success: false, error: 'เกิดข้อผิดพลาดในการลบการผูกกลุ่ม' },
      { status: 500 }
    );
  }
}
