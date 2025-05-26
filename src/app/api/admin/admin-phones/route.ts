import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import AdminPhone from '@/models/AdminPhone';
import { formatPhoneNumber } from '@/utils/deesmsx';

export async function GET() {
  await connectDB();
  const list = await AdminPhone.find().sort({ phoneNumber: 1 });
  return NextResponse.json(list);
}

export async function POST(request: NextRequest) {
  const { phoneNumber } = await request.json();
  if (!phoneNumber) {
    return NextResponse.json({ message: 'phoneNumber required' }, { status: 400 });
  }
  const formatted = formatPhoneNumber(phoneNumber);
  if (!/^66\d{9}$/.test(formatted)) {
    return NextResponse.json({ message: 'invalid phone' }, { status: 400 });
  }
  await connectDB();
  const doc = await AdminPhone.findOneAndUpdate(
    { phoneNumber: formatted },
    { phoneNumber: formatted },
    { upsert: true, new: true }
  );
  return NextResponse.json(doc);
}

export async function DELETE(request: NextRequest) {
  const { id, phoneNumber } = await request.json();
  if (!id && !phoneNumber) {
    return NextResponse.json({ message: 'id or phoneNumber required' }, { status: 400 });
  }
  await connectDB();
  const query = id ? { _id: id } : { phoneNumber: formatPhoneNumber(phoneNumber) };
  const result = await AdminPhone.findOneAndDelete(query);
  if (!result) {
    return NextResponse.json({ message: 'not found' }, { status: 404 });
  }
  return NextResponse.json({ success: true });
} 