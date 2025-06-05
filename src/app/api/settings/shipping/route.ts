import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import ShippingSetting from '@/models/ShippingSetting';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import { shippingSettingSchema } from '@schemas/shipping';

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
  const raw = await req.json();
  const parsed = shippingSettingSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ message: 'รูปแบบข้อมูลไม่ถูกต้อง', details: parsed.error.errors }, { status: 400 });
  }
  const { freeThreshold, fee, freeQuantityThreshold } = parsed.data;
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