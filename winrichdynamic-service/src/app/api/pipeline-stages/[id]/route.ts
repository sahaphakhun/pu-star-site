import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import PipelineStage from '@/models/PipelineStage';
import { updatePipelineStageSchema } from '@/schemas/pipelineStage';

// PATCH: อัปเดตสเตจตาม id
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    await connectDB();
    const body = await request.json();
    const parsed = updatePipelineStageSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'ข้อมูลไม่ถูกต้อง', details: parsed.error.issues }, { status: 400 });
    }
    const updated = await PipelineStage.findByIdAndUpdate(id, parsed.data, { new: true });
    if (!updated) return NextResponse.json({ error: 'ไม่พบสเตจ' }, { status: 404 });
    return NextResponse.json(updated);
  } catch (error) {
    console.error('[B2B] PATCH /pipeline-stages/:id error', error);
    return NextResponse.json({ error: 'ไม่สามารถอัปเดตสเตจได้' }, { status: 500 });
  }
}

// DELETE: ลบสเตจตาม id
export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    await connectDB();
    const deleted = await PipelineStage.findByIdAndDelete(id);
    if (!deleted) return NextResponse.json({ error: 'ไม่พบสเตจ' }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[B2B] DELETE /pipeline-stages/:id error', error);
    return NextResponse.json({ error: 'ไม่สามารถลบสเตจได้' }, { status: 500 });
  }
}


