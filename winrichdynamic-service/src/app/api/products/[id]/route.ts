import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Product from '@/models/Product';
import { verifyToken } from '@/lib/auth';

export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await connectDB();
    const doc = await Product.findById(params.id);
    if (!doc) return NextResponse.json({ error: 'ไม่พบสินค้า' }, { status: 404 });
    return NextResponse.json(doc);
  } catch (error) {
    console.error('[B2B] Error get product:', error);
    return NextResponse.json({ error: 'เกิดข้อผิดพลาดในการดึงสินค้า' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = verifyToken(request);
    if (!auth.valid) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    await connectDB();
    const body = await request.json();
    const update: any = {};
    const fields = ['name', 'price', 'description', 'imageUrl', 'units', 'category', 'options', 'isAvailable'];
    for (const f of fields) if (f in body) update[f] = body[f];
    const doc = await Product.findByIdAndUpdate(params.id, update, { new: true });
    if (!doc) return NextResponse.json({ error: 'ไม่พบสินค้า' }, { status: 404 });
    return NextResponse.json(doc);
  } catch (error) {
    console.error('[B2B] Error update product:', error);
    return NextResponse.json({ error: 'เกิดข้อผิดพลาดในการอัปเดตสินค้า' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = verifyToken(request);
    if (!auth.valid) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    await connectDB();
    const res = await Product.findByIdAndDelete(params.id);
    if (!res) return NextResponse.json({ error: 'ไม่พบสินค้า' }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('[B2B] Error delete product:', error);
    return NextResponse.json({ error: 'เกิดข้อผิดพลาดในการลบสินค้า' }, { status: 500 });
  }
}


