import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import SiteSetting from '@/models/SiteSetting';
import { verifyToken } from '@/lib/auth';

export async function GET() {
  try {
    await connectDB();
    const doc = await SiteSetting.findOne({}).sort({ createdAt: -1 });
    return NextResponse.json(doc || { shipping: { baseFee: 0 } });
  } catch (error) {
    return NextResponse.json({ error: 'ไม่สามารถดึงการตั้งค่าได้' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = verifyToken(request);
    if (!auth.valid) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    await connectDB();
    const body = await request.json();
    const doc = await SiteSetting.create(body);
    return NextResponse.json(doc, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'บันทึกการตั้งค่าไม่สำเร็จ' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const auth = verifyToken(request);
    if (!auth.valid) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    await connectDB();
    const body = await request.json();
    const doc = await SiteSetting.findOneAndUpdate({}, body, { upsert: true, new: true });
    return NextResponse.json(doc);
  } catch (error) {
    return NextResponse.json({ error: 'อัปเดตการตั้งค่าไม่สำเร็จ' }, { status: 500 });
  }
}


