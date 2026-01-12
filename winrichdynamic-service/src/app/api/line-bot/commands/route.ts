import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import LineCommand from '@/models/LineCommand';
import { ensureDefaultLineCommands } from '@/services/lineBotConfig';
import { requireAdminAuth, AdminAuthError } from '@/lib/adminAuth';

export async function GET(request: Request) {
  try {
    await requireAdminAuth(request);
    await connectDB();
    await ensureDefaultLineCommands();

    const commands = await LineCommand.find().sort({ priority: 1 }).lean();
    return NextResponse.json({ success: true, data: commands });
  } catch (error) {
    if (error instanceof AdminAuthError) {
      return NextResponse.json({ success: false, error: error.message }, { status: error.status });
    }
    console.error('[LineBot][Commands] GET error:', error);
    return NextResponse.json(
      { success: false, error: 'เกิดข้อผิดพลาดในการดึงคำสั่ง LINE' },
      { status: 500 }
    );
  }
}
