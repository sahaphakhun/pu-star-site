import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Order from '@/models/Order';
import cloudinary from '@/lib/cloudinary';
import { verifyToken } from '@/lib/auth';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = verifyToken(request);
    if (!auth.valid) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    await connectDB();
    const formData = await request.formData();
    const file = formData.get('file');
    const type = (formData.get('type') as string) || 'image';
    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: 'ไม่พบไฟล์' }, { status: 400 });
    }
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const upload = await new Promise<any>((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream({ folder: 'b2b/packing' }, (e, r) => {
        if (e) return reject(e);
        resolve(r);
      });
      stream.end(buffer);
    });
    const resolvedParams = await params;
    const doc = await Order.findByIdAndUpdate(
      resolvedParams.id,
      { $push: { packingProofs: { url: upload.secure_url, type, addedAt: new Date() } } },
      { new: true }
    );
    if (!doc) return NextResponse.json({ error: 'ไม่พบคำสั่งซื้อ' }, { status: 404 });
    return NextResponse.json(doc);
  } catch (error) {
    console.error('[B2B] Upload packing proof error:', error);
    return NextResponse.json({ error: 'อัปโหลดหลักฐานแพ็กของไม่สำเร็จ' }, { status: 500 });
  }
}


