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
    console.log('[Quotation PDF API] Generating PDF for quotation ID:', resolvedParams.id);
    
    const quotation = await Quotation.findById(resolvedParams.id).lean();
    
    if (!quotation) {
      console.log('[Quotation PDF API] Quotation not found');
      return NextResponse.json(
        { error: 'ไม่พบใบเสนอราคา' },
        { status: 404 }
      );
    }

    console.log('[Quotation PDF API] Quotation found:', {
      id: (quotation as any)._id,
      number: (quotation as any).quotationNumber,
      customer: (quotation as any).customerName
    });

    // Sanitize ข้อมูลเพื่อป้องกันปัญหา encoding
    const sanitizedQuotation = sanitizeQuotationData(quotation as any);
    console.log('[Quotation PDF API] Data sanitized successfully');
    
    // สร้าง HTML สำหรับ PDF
    const html = generateQuotationHTML(sanitizedQuotation);
    console.log('[Quotation PDF API] HTML generated, length:', html.length);
    
    // สร้าง PDF ด้วย Puppeteer
    console.log('[Quotation PDF API] Starting PDF generation...');
    const pdfBuffer = await generatePDFFromHTML(html);
    console.log('[Quotation PDF API] PDF generated successfully, size:', pdfBuffer.length);
    
    // ส่งกลับเป็น PDF
    return new NextResponse(pdfBuffer as any, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="ใบเสนอราคา_${sanitizedQuotation.quotationNumber || 'unknown'}.pdf"`
      }
    });
    
  } catch (error) {
    console.error('[Quotation PDF API] Error:', error);
    
    // ส่งกลับ error message ที่ชัดเจนขึ้น
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { 
        error: 'เกิดข้อผิดพลาดในการสร้าง PDF',
        details: errorMessage,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

// ฟังก์ชัน sanitize ข้อมูล quotation
function sanitizeQuotationData(quotation: any): any {
  // แปลงข้อมูลเป็น string และทำความสะอาด
  const sanitizeString = (str: any): string => {
    if (!str) return '';
    const cleanStr = String(str)
      .replace(/[\u0000-\u001F\u007F-\u009F]/g, '') // ลบ control characters
      .replace(/[\uFFFD]/g, '') // ลบ replacement characters
      .trim();
    
    // ตรวจสอบว่าเป็น string ที่ถูกต้อง
    try {
      return Buffer.from(cleanStr, 'utf8').toString('utf8');
    } catch {
      return cleanStr.replace(/[^\u0E00-\u0E7F\u0020-\u007E]/g, '');
    }
  };

  const sanitizeArray = (arr: any[]): any[] => {
    if (!Array.isArray(arr)) return [];
    return arr.map(item => ({
      ...item,
      productName: sanitizeString(item.productName),
      description: sanitizeString(item.description),
      unit: sanitizeString(item.unit)
    }));
  };

  return {
    ...quotation,
    quotationNumber: sanitizeString(quotation.quotationNumber),
    customerName: sanitizeString(quotation.customerName),
    customerTaxId: sanitizeString(quotation.customerTaxId),
    customerAddress: sanitizeString(quotation.customerAddress),
    customerPhone: sanitizeString(quotation.customerPhone),
    subject: sanitizeString(quotation.subject),
    paymentTerms: sanitizeString(quotation.paymentTerms),
    deliveryTerms: sanitizeString(quotation.deliveryTerms),
    notes: sanitizeString(quotation.notes),
    items: sanitizeArray(quotation.items || [])
  };
}


