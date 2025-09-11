import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import PipelineStage from '@/models/PipelineStage';

const DEFAULT_STAGES = [
  { name: 'New', order: 0, color: '#111827', probability: 10, isDefault: true },
  { name: 'Qualified', order: 1, color: '#2563eb', probability: 25, isDefault: true },
  { name: 'Proposal', order: 2, color: '#7c3aed', probability: 50, isDefault: true },
  { name: 'Negotiation', order: 3, color: '#d97706', probability: 70, isDefault: true },
  { name: 'Won', order: 4, color: '#059669', probability: 100, isDefault: true },
  { name: 'Lost', order: 5, color: '#dc2626', probability: 0, isDefault: true },
];

export async function GET() {
  try {
    await connectDB();
    let stages = await PipelineStage.find().sort({ order: 1 }).lean();
    if (!stages.length) {
      await PipelineStage.insertMany(DEFAULT_STAGES);
      stages = await PipelineStage.find().sort({ order: 1 }).lean();
    }
    return NextResponse.json(stages);
  } catch (err) {
    console.error('[PipelineStages] GET error', err);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import PipelineStage from '@/models/PipelineStage';
import { createPipelineStageSchema, updatePipelineStageSchema } from '@/schemas/pipelineStage';

// GET: ดึงรายการสเตจทั้งหมด (รองรับ team)
export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const url = new URL(request.url);
    const team = url.searchParams.get('team') || undefined;
    const filter: Record<string, any> = {};
    if (team) filter.team = team;
    const stages = await PipelineStage.find(filter).sort({ order: 1 }).lean();
    return NextResponse.json(stages);
  } catch (error) {
    console.error('[B2B] GET /pipeline-stages error', error);
    return NextResponse.json({ error: 'ไม่สามารถดึงรายการสเตจได้' }, { status: 500 });
  }
}

// POST: สร้างสเตจใหม่
export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const body = await request.json();
    const parsed = createPipelineStageSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'ข้อมูลไม่ถูกต้อง', details: parsed.error.issues }, { status: 400 });
    }
    const stage = await PipelineStage.create(parsed.data);
    return NextResponse.json(stage, { status: 201 });
  } catch (error) {
    console.error('[B2B] POST /pipeline-stages error', error);
    return NextResponse.json({ error: 'ไม่สามารถสร้างสเตจได้' }, { status: 500 });
  }
}

// PUT: อัปเดตหลายเรคคอร์ดแบบ reorder (optional)
export async function PUT(request: NextRequest) {
  try {
    await connectDB();
    const body = await request.json();
    // คาดรูปแบบ: [{ _id, order }]
    const items: Array<{ _id: string; order: number }> = Array.isArray(body) ? body : [];
    const bulk = items.map((it) => ({
      updateOne: {
        filter: { _id: it._id },
        update: { $set: { order: it.order } },
      },
    }));
    if (bulk.length === 0) return NextResponse.json({ updated: 0 });
    const res = await PipelineStage.bulkWrite(bulk);
    return NextResponse.json({ updated: res.modifiedCount || 0 });
  } catch (error) {
    console.error('[B2B] PUT /pipeline-stages error', error);
    return NextResponse.json({ error: 'ไม่สามารถอัปเดตลำดับสเตจได้' }, { status: 500 });
  }
}


