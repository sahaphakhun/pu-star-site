import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Quotation from '@/models/Quotation';
import { Settings } from '@/models/Settings';
import { generatePDFFromHTML } from '@/utils/pdfUtils';
import { generateQuotationHTML } from '@/utils/quotationPdf';
import Product from '@/models/Product';
import Admin from '@/models/Admin';
import * as jose from 'jose';
import { cookies } from 'next/headers';
import { issueSalesOrderSchema } from '@/schemas/quotation';

// GET: สร้าง PDF ใบเสนอราคา
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    
    const resolvedParams = await params;
    const quotation = await Quotation.findById(resolvedParams.id).lean();
    
    if (!quotation) {
      return NextResponse.json(
        { error: 'ไม่พบใบเสนอราคา' },
        { status: 404 }
      );
    }

    // RBAC: ถ้าเป็น Seller ต้องเป็นเจ้าของเท่านั้น
    try {
      const authHeader = request.headers.get('authorization');
      const bearer = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : undefined;
      const cookieToken = (await cookies()).get('b2b_token')?.value;
      const token = bearer || cookieToken;
      if (token) {
        const payload: any = jose.decodeJwt(token);
        const roleName = String(payload.role || '').toLowerCase();
        if (roleName === 'seller' && String((quotation as any).assignedTo) !== String(payload.adminId)) {
          return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }
      }
    } catch {}

    // ดึง Settings (โลโก้ + ข้อมูลบริษัท/บัญชีธนาคาร)
    const settings = await Settings.findOne();
    // ดึง SKU ของสินค้าแต่ละตัวจาก Product ตาม productId
    const q: any = quotation as any;
    const productIds = (q.items || []).map((it: any) => it.productId).filter(Boolean);
    const products = productIds.length ? await Product.find({ _id: { $in: productIds } }).lean() : [];
    const idToSku: Record<string, string> = {};
    for (const p of products as any[]) {
      idToSku[String(p._id)] = p.sku;
    }

    const enrichedItems = (q.items || []).map((it: any) => ({
      ...it,
      sku: idToSku[it.productId] || undefined,
    }));

    // แนบข้อมูลฝ่ายขายจาก assignedTo (ถ้ามี)
    let salesInfo: any = {};
    try {
      const ownerId = (quotation as any).assignedTo;
      if (ownerId) {
        const admin: any = await Admin.findById(ownerId).lean();
        if (admin) {
          salesInfo = {
            salesName: admin.name || undefined,
            salesPhone: admin.phone || undefined,
            salesEmail: admin.email || undefined,
          };
        }
      }
    } catch {}

    const quotationWithSettings = {
      ...quotation,
      items: enrichedItems,
      ...salesInfo,
      logoUrl: settings?.logoUrl || '',
      companyName: settings?.companyName || undefined,
      companyAddress: settings?.companyAddress || undefined,
      companyPhone: settings?.companyPhone || undefined,
      companyEmail: settings?.companyEmail || undefined,
      companyWebsite: settings?.companyWebsite || undefined,
      taxId: settings?.taxId || undefined,
      bankInfo: settings?.bankInfo || undefined,
    };

    // สร้าง HTML สำหรับ PDF
    const html = generateQuotationHTML(quotationWithSettings as any);
    
    // สร้าง PDF ด้วย Puppeteer
    const pdfBuffer = await generatePDFFromHTML(html);
    
    // เตรียมชื่อไฟล์และทำให้ปลอดภัยสำหรับ HTTP headers
    const fileName = `ใบเสนอราคา_${(quotation as any).quotationNumber || 'unknown'}.pdf`;
    const asciiFileName = `quotation_${(quotation as any).quotationNumber || 'unknown'}.pdf`;
    const encodedFileName = encodeURIComponent(fileName);

    // ส่งกลับเป็น PDF
    return new NextResponse(pdfBuffer as any, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${asciiFileName}"; filename*=UTF-8''${encodedFileName}`
      }
    });
    
  } catch (error) {
    console.error('[Quotation PDF API] Error:', error);
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการสร้าง PDF' },
      { status: 500 }
    );
  }
}

// POST: ออกใบสั่งขาย (PDF) จากใบเสนอราคา พร้อมอัพเดทสถานะว่าออกแล้ว
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const raw = await request.json();
    const parsed = issueSalesOrderSchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json({ error: 'รูปแบบข้อมูลไม่ถูกต้อง', details: parsed.error.issues }, { status: 400 });
    }
    const { salesOrderNumber, remark } = parsed.data;

    const resolvedParams = await params;
    const quotation = await Quotation.findById(resolvedParams.id);
    if (!quotation) {
      return NextResponse.json({ error: 'ไม่พบใบเสนอราคา' }, { status: 404 });
    }

    // อนุญาตเฉพาะใบเสนอราคาที่ accepted หรือ sent/draft ตามนโยบาย (ยึด accepted เพื่อความชัดเจน)
    if (quotation.status !== 'accepted') {
      return NextResponse.json({ error: 'สามารถออกใบสั่งขายได้เฉพาะใบเสนอราคาที่ลูกค้ายอมรับแล้ว' }, { status: 400 });
    }

    // อัพเดทสถานะออกใบสั่งขาย
    quotation.salesOrderIssued = true;
    quotation.salesOrderNumber = salesOrderNumber;
    quotation.salesOrderIssuedAt = new Date();
    const editLog: any = {
      editedAt: new Date(),
      remark: `ออกใบสั่งขายเลขที่ ${salesOrderNumber}: ${remark}`,
      changedFields: ['salesOrderIssued', 'salesOrderNumber', 'salesOrderIssuedAt'],
    };
    try {
      const authHeader = request.headers.get('authorization');
      const bearer = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : undefined;
      const cookieToken = (await cookies()).get('b2b_token')?.value;
      const token = bearer || cookieToken;
      if (token) {
        const payload: any = jose.decodeJwt(token);
        if (payload?.adminId) editLog.editedBy = String(payload.adminId);
      }
    } catch {}
    quotation.editHistory = [...(quotation.editHistory || []), editLog] as any;
    await quotation.save();

    // ส่งต่อไปยังการสร้าง PDF ใบเสนอราคาเดิม (reuse) หรือจะมีไฟล์ template ใบสั่งขายแยกในอนาคต
    const req2 = new NextRequest(request.url, { method: 'GET', headers: request.headers });
    return await GET(req2, { params });
  } catch (error) {
    console.error('[Quotation PDF API] POST (issue SO) Error:', error);
    return NextResponse.json({ error: 'เกิดข้อผิดพลาดในการออกใบสั่งขาย' }, { status: 500 });
  }
}
