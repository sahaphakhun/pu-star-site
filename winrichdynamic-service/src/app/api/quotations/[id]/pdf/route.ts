import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Quotation from '@/models/Quotation';
import { Settings } from '@/models/Settings';
import { generatePDFFromHTML } from '@/utils/pdfUtils';
import { generateQuotationHTML } from '@/utils/quotationPdf';
import Product from '@/models/Product';

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

    // ดึง Settings (โลโก้ + ข้อมูลบริษัท/บัญชีธนาคาร)
    const settings = await Settings.findOne();
    // ดึง SKU ของสินค้าแต่ละตัวจาก Product ตาม productId
    const productIds = (quotation.items || []).map((it: any) => it.productId).filter(Boolean);
    const products = productIds.length ? await Product.find({ _id: { $in: productIds } }).lean() : [];
    const idToSku: Record<string, string> = {};
    for (const p of products as any[]) {
      idToSku[String(p._id)] = p.sku;
    }

    const enrichedItems = (quotation.items || []).map((it: any) => ({
      ...it,
      sku: idToSku[it.productId] || undefined,
    }));

    const quotationWithSettings = {
      ...quotation,
      items: enrichedItems,
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

