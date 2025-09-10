import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Activity from '@/models/Activity';
import { updateActivitySchema } from '@/schemas/activity';

// GET: รายละเอียดกิจกรรม
export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await connectDB();
    const item = await Activity.findById(params.id).lean();
    if (!item) return NextResponse.json({ error: 'ไม่พบกิจกรรม' }, { status: 404 });
    return NextResponse.json(item);
  } catch (error) {
    console.error('[B2B] GET /activities/:id error', error);
    return NextResponse.json({ error: 'ไม่สามารถดึงรายละเอียดกิจกรรมได้' }, { status: 500 });
  }
}

// PATCH: อัปเดตกิจกรรม
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await connectDB();
    const body = await request.json();
    const parsed = updateActivitySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'ข้อมูลไม่ถูกต้อง', details: parsed.error.issues }, { status: 400 });
    }
    const updated = await Activity.findByIdAndUpdate(params.id, parsed.data, { new: true });
    if (!updated) return NextResponse.json({ error: 'ไม่พบกิจกรรม' }, { status: 404 });
    return NextResponse.json(updated);
  } catch (error) {
    console.error('[B2B] PATCH /activities/:id error', error);
    return NextResponse.json({ error: 'ไม่สามารถอัปเดตกิจกรรมได้' }, { status: 500 });
  }
}

// DELETE: ลบกิจกรรม
export async function DELETE(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await connectDB();
    const deleted = await Activity.findByIdAndDelete(params.id);
    if (!deleted) return NextResponse.json({ error: 'ไม่พบกิจกรรม' }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[B2B] DELETE /activities/:id error', error);
    return NextResponse.json({ error: 'ไม่สามารถลบกิจกรรมได้' }, { status: 500 });
  }
}


