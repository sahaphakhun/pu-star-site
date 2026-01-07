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
import { sendLineTextToCustomerGroups } from '@/app/notification/group';

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
    let requesterAdminId: string | undefined;
    let requesterRoleName: string | undefined;
    try {
      const authHeader = request.headers.get('authorization');
      const bearer = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : undefined;
      const cookieToken = (await cookies()).get('b2b_token')?.value;
      const token = bearer || cookieToken;
      if (token) {
        const payload: any = jose.decodeJwt(token);
        const roleName = String(payload.role || '').toLowerCase();
        requesterRoleName = roleName;
        requesterAdminId = payload?.adminId ? String(payload.adminId) : undefined;
        if (roleName === 'seller' && String((quotation as any).assignedTo) !== String(payload.adminId)) {
          return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }
      }
    } catch { }

    // ดึง Settings (โลโก้ + ข้อมูลบริษัท/บัญชีธนาคาร)
    const settings = await Settings.findOne();
    // ดึง SKU ของสินค้าแต่ละตัวจาก Product ตาม productId
    const q: any = quotation as any;
    const productIds = (q.items || []).map((it: any) => it.productId).filter(Boolean);
    const products = productIds.length ? await Product.find({ _id: { $in: productIds } }).lean() : [];
    const skuMap: Record<string, { defaultSku?: string; unitSku: Record<string, string> }> = {};
    for (const p of products as any[]) {
      const productId = String(p._id);
      const unitSku: Record<string, string> = {};
      if (Array.isArray(p.units)) {
        for (const unit of p.units) {
          if (unit?.label && unit?.sku) {
            unitSku[String(unit.label)] = String(unit.sku);
          }
        }
      }
      skuMap[productId] = {
        defaultSku: p.sku ? String(p.sku) : undefined,
        unitSku,
      };
    }

    const enrichedItems = (q.items || []).map((it: any) => {
      const productId = String(it.productId || '');
      const skuInfo = skuMap[productId] || { unitSku: {} };
      const unitSku = skuInfo.unitSku?.[String(it.unit || '')];
      const resolvedSku = (typeof it.sku === 'string' && it.sku.trim()) || unitSku || skuInfo.defaultSku;
      return {
        ...it,
        sku: resolvedSku || undefined,
      };
    });

    // แนบข้อมูลฝ่ายขายจาก assignedTo (ถ้ามี)
    let salesInfo: any = {};
    let signatureInfo: any = {};
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
          if (admin.signatureUrl || admin.name) {
            signatureInfo = {
              ...signatureInfo,
              quoterName: admin.name || undefined,
              quoterSignatureUrl: admin.signatureUrl || undefined,
              quoterPosition: admin.position || undefined,
            };
          }
        }
      }
    } catch { }

    // เติมลายเซ็นจากผู้ที่เรียกพิมพ์ (ตามบทบาท)
    try {
      if (requesterAdminId) {
        const requester: any = await Admin.findById(requesterAdminId).lean();
        if (requester && (requester.signatureUrl || requester.name)) {
          if (requesterRoleName === 'seller' && !signatureInfo?.quoterSignatureUrl) {
            signatureInfo = {
              ...signatureInfo,
              quoterName: requester.name || signatureInfo.quoterName,
              quoterSignatureUrl: requester.signatureUrl || signatureInfo.quoterSignatureUrl,
              quoterPosition: requester.position || signatureInfo.quoterPosition,
            };
          } else if (requesterRoleName && requesterRoleName !== 'seller') {
            signatureInfo = {
              ...signatureInfo,
              approverName: requester.name || undefined,
              approverSignatureUrl: requester.signatureUrl || undefined,
              approverPosition: requester.position || undefined,
            };
          }
        }
      }
    } catch { }

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
    const html = generateQuotationHTML(quotationWithSettings as any, signatureInfo);

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
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : '';
    console.error('[Quotation PDF API] Error:', errorMessage);
    console.error('[Quotation PDF API] Stack:', errorStack);
    console.error('[Quotation PDF API] PUPPETEER_EXECUTABLE_PATH:', process.env.PUPPETEER_EXECUTABLE_PATH);
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการสร้าง PDF', details: errorMessage },
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
    } catch { }
    quotation.editHistory = [...(quotation.editHistory || []), editLog] as any;
    await quotation.save();

    // ส่งต่อไปยังการสร้าง PDF ใบเสนอราคาเดิม (reuse) หรือจะมีไฟล์ template ใบสั่งขายแยกในอนาคต
    const req2 = new NextRequest(request.url, { method: 'GET', headers: request.headers });

    // แจ้ง LINE กลุ่ม
    try {
      const qn = (quotation as any).quotationNumber || (await params).id;
      const msg = `ออกใบสั่งขายแล้ว เลขที่ ${salesOrderNumber} (จากใบเสนอราคา ${qn})`;
      await sendLineTextToCustomerGroups(String((quotation as any).customerId), msg);
    } catch (e) {
      console.warn('[Quotation Issue SO] LINE notify failed:', e);
    }

    return await GET(req2, { params });
  } catch (error) {
    console.error('[Quotation PDF API] POST (issue SO) Error:', error);
    return NextResponse.json({ error: 'เกิดข้อผิดพลาดในการออกใบสั่งขาย' }, { status: 500 });
  }
}
