import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import ShippingSetting from '@/models/ShippingSetting';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

const getAuth = async () => {
  const cookieStore = (await cookies()) as any;
  const token = cookieStore.get?.('token') || cookieStore.get('token');
  if (!token) return null;
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default_secret_replace_in_production') as any;
    return decoded;
  } catch {
    return null;
  }
};

export async function GET() {
  await connectDB();
  let doc = await ShippingSetting.findOne().lean();
  if (!doc) {
    const created = await ShippingSetting.create({});
    doc = created.toObject();
  }
  return NextResponse.json(doc);
}

export async function PUT(req: NextRequest) {
  const auth = await getAuth();
  if (!auth || auth.role !== 'admin') {
    return NextResponse.json({ message: 'unauthorized' }, { status: 401 });
  }
  const { freeThreshold, fee, freeQuantityThreshold } = await req.json();
  await connectDB();
  let doc = await ShippingSetting.findOne();
  if (!doc) {
    doc = new ShippingSetting({ freeThreshold, fee });
  } else {
    if (freeThreshold !== undefined) doc.freeThreshold = freeThreshold;
    if (fee !== undefined) doc.fee = fee;
    if (freeQuantityThreshold !== undefined) doc.freeQuantityThreshold = freeQuantityThreshold;
  }
  await doc.save();
  return NextResponse.json(doc);
} 