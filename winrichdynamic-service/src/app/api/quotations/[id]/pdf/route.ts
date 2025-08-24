import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Quotation from '@/models/Quotation';
import { generatePDFFromHTML, generateQuotationHTML } from '@/utils/pdfUtils';

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

    // สร้าง HTML สำหรับ PDF
    const html = generateQuotationHTML(quotation as any);
    
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


