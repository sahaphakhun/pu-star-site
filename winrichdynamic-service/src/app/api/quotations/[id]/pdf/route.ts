import { NextRequest, NextResponse } from 'next/server';
import { buildSalesOrderNumber } from '@/utils/salesOrderNumber';
import { issueSalesOrderSchema } from '@/schemas/quotation';
import { sendLineTextToCustomerGroups } from '@/app/notification/group';
import connectDB from '@/lib/mongodb';
import Quotation from '@/models/Quotation';
import { buildQuotationPdfResponse } from '@/services/quotationPdfService';

// GET: สร้าง PDF ใบเสนอราคา
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    return await buildQuotationPdfResponse(request, resolvedParams.id);

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
    const { remark } = parsed.data;

    const resolvedParams = await params;
    const quotation = await Quotation.findById(resolvedParams.id);
    if (!quotation) {
      return NextResponse.json({ error: 'ไม่พบใบเสนอราคา' }, { status: 404 });
    }

    const existingSalesOrderNumber = typeof (quotation as any).salesOrderNumber === 'string'
      ? String((quotation as any).salesOrderNumber).trim()
      : '';
    const resolvedSalesOrderNumber =
      existingSalesOrderNumber || buildSalesOrderNumber(quotation._id);

    // อัพเดทสถานะออกใบสั่งขาย
    quotation.salesOrderIssued = true;
    quotation.salesOrderNumber = resolvedSalesOrderNumber;
    quotation.salesOrderIssuedAt = new Date();
    const editLog: any = {
      editedAt: new Date(),
      remark: `ออกใบสั่งขายเลขที่ ${resolvedSalesOrderNumber}: ${remark}`,
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
      const msg = `ออกใบสั่งขายแล้ว เลขที่ ${resolvedSalesOrderNumber} (จากใบเสนอราคา ${qn})`;
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
