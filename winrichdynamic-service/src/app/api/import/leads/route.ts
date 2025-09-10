import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Lead from '@/models/Lead';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const form = await request.formData();
    const file = form.get('file');
    if (!file || !(file instanceof File)) return NextResponse.json({ error: 'ไม่พบไฟล์' }, { status: 400 });
    const text = await file.text();
    const lines = text.split(/\r?\n/).filter(Boolean);
    // คาดหัวคอลัมน์: name,phone,email,company,source,score
    const [header, ...rows] = lines;
    const inserted: any[] = [];
    for (const line of rows) {
      const [name, phone, email, company, source, scoreStr] = line.split(',');
      if (!name) continue;
      const score = Number(scoreStr || '0') || 0;
      const doc = { name: name.trim(), phone: phone?.trim(), email: email?.trim(), company: company?.trim(), source: (source?.trim() as any) || 'other', score };
      const exist = (doc.email && await Lead.findOne({ email: doc.email })) || (doc.phone && await Lead.findOne({ phone: doc.phone }));
      if (exist) continue;
      inserted.push(await Lead.create(doc));
    }
    return NextResponse.json({ inserted: inserted.length });
  } catch (error) {
    console.error('[B2B] Import leads error', error);
    return NextResponse.json({ error: 'นำเข้าไม่ได้' }, { status: 500 });
  }
}


