import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Note from '@/models/Note';
import { updateNoteSchema } from '@/schemas/note';

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    await connectDB();
    const note = await Note.findById(id).lean();
    if (!note) return NextResponse.json({ error: 'ไม่พบโน้ต' }, { status: 404 });
    return NextResponse.json(note);
  } catch (error) {
    console.error('[B2B] GET /notes/:id error', error);
    return NextResponse.json({ error: 'ไม่สามารถดึงโน้ตได้' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    await connectDB();
    const body = await request.json();
    const parsed = updateNoteSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: 'ข้อมูลไม่ถูกต้อง', details: parsed.error.issues }, { status: 400 });
    const updated = await Note.findByIdAndUpdate(id, parsed.data, { new: true });
    if (!updated) return NextResponse.json({ error: 'ไม่พบโน้ต' }, { status: 404 });
    return NextResponse.json(updated);
  } catch (error) {
    console.error('[B2B] PATCH /notes/:id error', error);
    return NextResponse.json({ error: 'ไม่สามารถอัปเดตโน้ตได้' }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    await connectDB();
    const deleted = await Note.findByIdAndDelete(id);
    if (!deleted) return NextResponse.json({ error: 'ไม่พบโน้ต' }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[B2B] DELETE /notes/:id error', error);
    return NextResponse.json({ error: 'ไม่สามารถลบโน้ตได้' }, { status: 500 });
  }
}


