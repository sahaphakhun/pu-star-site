import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import LineCommand from '@/models/LineCommand';
import { compileLineCommandPattern } from '@/utils/lineCommand';
import { requireAdminAuth, AdminAuthError } from '@/lib/adminAuth';

export async function PATCH(request: Request, context: { params: { id: string } }) {
  try {
    await requireAdminAuth(request);
    await connectDB();

    const body = await request.json();
    const updates: Record<string, any> = {};

    if (typeof body.name === 'string') updates.name = body.name.trim();
    if (typeof body.description === 'string') updates.description = body.description.trim();
    if (typeof body.priority === 'number') updates.priority = body.priority;
    if (typeof body.isActive === 'boolean') updates.isActive = body.isActive;
    if (typeof body.pattern === 'string') {
      compileLineCommandPattern(body.pattern);
      updates.pattern = body.pattern.trim();
    }

    const command = await LineCommand.findByIdAndUpdate(
      context.params.id,
      { $set: updates },
      { new: true }
    );

    if (!command) {
      return NextResponse.json(
        { success: false, error: 'ไม่พบคำสั่งที่ต้องการแก้ไข' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: command });
  } catch (error) {
    if (error instanceof AdminAuthError) {
      return NextResponse.json({ success: false, error: error.message }, { status: error.status });
    }
    if (error instanceof Error && error.message.includes('Pattern')) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }
    console.error('[LineBot][Commands] PATCH error:', error);
    return NextResponse.json(
      { success: false, error: 'เกิดข้อผิดพลาดในการแก้ไขคำสั่ง LINE' },
      { status: 500 }
    );
  }
}
