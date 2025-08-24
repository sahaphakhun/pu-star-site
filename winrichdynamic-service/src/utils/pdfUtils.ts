import puppeteer from 'puppeteer';

export interface PDFOptions {
  format?: 'A4' | 'A3' | 'Letter' | 'Legal';
  printBackground?: boolean;
  margin?: {
    top?: string;
    right?: string;
    bottom?: string;
    left?: string;
  };
  landscape?: boolean;
}

export interface QuotationData {
  quotationNumber: string;
  customerName: string;
  customerTaxId?: string;
  customerAddress?: string;
  customerPhone?: string;
  subject: string;
  validUntil: Date;
  paymentTerms: string;
  deliveryTerms?: string;
  items: Array<{
    productName: string;
    description?: string;
    quantity: number;
    unit: string;
    unitPrice: number;
    discount: number;
    totalPrice: number;
  }>;
  subtotal: number;
  totalDiscount: number;
  totalAmount: number;
  vatRate: number;
  vatAmount: number;
  grandTotal: number;
  notes?: string;
  createdAt: Date;
}



/**
 * ทำความสะอาดข้อมูลเพื่อป้องกันปัญหา encoding
 */
function sanitizeString(str: any): string {
  if (!str) return '';
  
  try {
    // แปลงเป็น string และทำความสะอาด
    let cleanStr = String(str);
    
    // ลบ control characters และ replacement characters
    cleanStr = cleanStr
      .replace(/[\u0000-\u001F\u007F-\u009F]/g, '')
      .replace(/[\uFFFD]/g, '')
      .trim();
    
    // ตรวจสอบว่าเป็น string ที่ถูกต้อง
    if (cleanStr.length === 0) return '';
    
    // ลองแปลงเป็น Buffer และกลับมาเป็น string
    const buffer = Buffer.from(cleanStr, 'utf8');
    const result = buffer.toString('utf8');
    
    // ตรวจสอบว่าผลลัพธ์ไม่เป็น empty
    return result || cleanStr;
  } catch (error) {
    console.warn('Error sanitizing string:', error);
    // Fallback: ใช้เฉพาะตัวอักษรที่ปลอดภัย
    return String(str).replace(/[^\u0E00-\u0E7F\u0020-\u007E]/g, '');
  }
}

/**
 * ทำความสะอาดข้อมูล quotation
 */
function sanitizeQuotationData(quotation: any): any {
  try {
    const sanitizeArray = (arr: any[]): any[] => {
      if (!Array.isArray(arr)) return [];
      return arr.map(item => ({
        ...item,
        productName: sanitizeString(item.productName),
        description: sanitizeString(item.description),
        unit: sanitizeString(item.unit)
      }));
    };

    const sanitized = {
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

    // ตรวจสอบว่าข้อมูลที่ sanitize แล้วไม่เป็น empty
    if (!sanitized.customerName || !sanitized.subject) {
      console.warn('Critical fields are empty after sanitization');
    }

    return sanitized;
  } catch (error) {
    console.error('Error sanitizing quotation data:', error);
    // Fallback: ส่งคืนข้อมูลต้นฉบับ
    return quotation;
  }
}

/**
 * สร้าง PDF จาก HTML ด้วย Puppeteer
 */
export async function generatePDFFromHTML(
  html: string, 
  options: PDFOptions = {}
): Promise<Buffer> {
  const browser = await puppeteer.launch({
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--font-render-hinting=none',
      '--disable-web-security',
      '--allow-running-insecure-content'
    ]
  });
  
  try {
    const page = await browser.newPage();
    
    // ตั้งค่า viewport
    await page.setViewport({ 
      width: 1200, 
      height: 1600 
    });
    
    // ตั้งค่า content
    await page.setContent(html, { 
      waitUntil: 'networkidle0' 
    });
    
    // รอให้ font โหลดเสร็จ
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // สร้าง PDF
    const pdfBuffer = await page.pdf({
      format: options.format || 'A4',
      printBackground: options.printBackground !== false,
      margin: {
        top: options.margin?.top || '20mm',
        right: options.margin?.right || '20mm',
        bottom: options.margin?.bottom || '20mm',
        left: options.margin?.left || '20mm'
      },
      landscape: options.landscape || false
    });
    
    return Buffer.from(pdfBuffer);
  } finally {
    await browser.close();
  }
}

/**
 * สร้าง HTML สำหรับใบเสนอราคา
 */
export function generateQuotationHTML(quotation: QuotationData): string {
  try {
    // ทำความสะอาดข้อมูลก่อน
    const sanitizedQuotation = sanitizeQuotationData(quotation);
    
    console.log('Original quotation:', {
      customerName: quotation.customerName,
      subject: quotation.subject,
      itemsCount: quotation.items?.length
    });
    
    console.log('Sanitized quotation:', {
      customerName: sanitizedQuotation.customerName,
      subject: sanitizedQuotation.subject,
      itemsCount: sanitizedQuotation.items?.length
    });
    
    const formatDate = (dateString: string | Date) => {
      const date = new Date(dateString);
      return date.toLocaleDateString('th-TH', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    };

    const formatCurrency = (amount: number) => {
      return new Intl.NumberFormat('th-TH', {
        style: 'currency',
        currency: 'THB',
      }).format(amount);
    };

  return `
<!DOCTYPE html>
<html lang="th">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>ใบเสนอราคา ${sanitizedQuotation.quotationNumber}</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Sarabun:wght@300;400;500;600;700&display=swap');
        
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Sarabun', 'Tahoma', sans-serif;
            font-size: 14px;
            line-height: 1.6;
            color: #333;
            background: white;
        }
        
        .container {
            max-width: 210mm;
            margin: 0 auto;
            padding: 20px;
            background: white;
        }
        
        .header {
            text-align: center;
            border-bottom: 3px solid #2563eb;
            padding-bottom: 20px;
            margin-bottom: 30px;
            position: relative;
        }
        
        .logo {
            width: 120px;
            height: auto;
            margin: 0 auto 15px;
            display: block;
        }
        
        .header h1 {
            margin: 0;
            font-size: 32px;
            font-weight: 700;
            color: #1e40af;
            text-transform: uppercase;
            letter-spacing: 2px;
        }
        
        .header p {
            margin: 5px 0;
            color: #6b7280;
            font-size: 16px;
        }
        
        .company-info {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 40px;
            margin-bottom: 30px;
            background: #f8fafc;
            padding: 25px;
            border-radius: 12px;
            border-left: 5px solid #2563eb;
        }
        
        .info-section h3 {
            margin: 0 0 15px 0;
            font-size: 18px;
            font-weight: 600;
            color: #1e40af;
            border-bottom: 2px solid #dbeafe;
            padding-bottom: 8px;
        }
        
        .info-section p {
            margin: 8px 0;
            color: #374151;
            font-size: 14px;
        }
        
        .quotation-details {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 20px;
            margin-bottom: 30px;
            background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
            padding: 25px;
            border-radius: 12px;
            border: 1px solid #bfdbfe;
        }
        
        .detail-item {
            text-align: center;
            padding: 15px;
            background: white;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        
        .detail-item .label {
            font-size: 12px;
            color: #6b7280;
            margin-bottom: 8px;
            font-weight: 500;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        
        .detail-item .value {
            font-size: 16px;
            font-weight: 600;
            color: #1e40af;
        }
        
        .subject {
            font-size: 22px;
            font-weight: 600;
            margin-bottom: 30px;
            text-align: center;
            color: #1f2937;
            background: #f3f4f6;
            padding: 20px;
            border-radius: 8px;
            border-left: 5px solid #10b981;
        }
        
        table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 30px;
            background: white;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        }
        
        th, td {
            border: 1px solid #e5e7eb;
            padding: 15px 12px;
            text-align: left;
            vertical-align: top;
        }
        
        th {
            background: linear-gradient(135deg, #1e40af 0%, #2563eb 100%);
            color: white;
            font-weight: 600;
            font-size: 14px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        
        td {
            font-size: 14px;
            background: white;
        }
        
        tr:nth-child(even) td {
            background: #f9fafb;
        }
        
        .text-center { text-align: center; }
        .text-right { text-align: right; }
        .text-left { text-align: left; }
        
        .summary {
            display: flex;
            justify-content: flex-end;
            margin-bottom: 30px;
        }
        
        .summary-table {
            width: 350px;
            background: #f8fafc;
            border-radius: 12px;
            padding: 25px;
            border: 2px solid #dbeafe;
        }
        
        .summary-table .row {
            display: flex;
            justify-content: space-between;
            padding: 12px 0;
            border-bottom: 1px solid #e5e7eb;
            font-size: 14px;
        }
        
        .summary-table .row:last-child {
            border-bottom: none;
        }
        
        .summary-table .total {
            font-weight: 700;
            font-size: 18px;
            border-top: 3px solid #2563eb;
            padding-top: 15px;
            margin-top: 15px;
            color: #1e40af;
        }
        
        .terms {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 40px;
            margin-bottom: 30px;
        }
        
        .terms h3 {
            margin: 0 0 15px 0;
            font-size: 16px;
            font-weight: 600;
            color: #1e40af;
            border-bottom: 2px solid #dbeafe;
            padding-bottom: 8px;
        }
        
        .terms p {
            margin: 0;
            color: #374151;
            line-height: 1.8;
        }
        
        .notes {
            margin-bottom: 30px;
            background: #fef3c7;
            padding: 20px;
            border-radius: 8px;
            border-left: 5px solid #f59e0b;
        }
        
        .notes h3 {
            margin: 0 0 15px 0;
            font-size: 16px;
            font-weight: 600;
            color: #92400e;
        }
        
        .notes p {
            margin: 0;
            color: #78350f;
            line-height: 1.8;
        }
        
        .signatures {
            display: flex;
            justify-content: space-between;
            margin-top: 50px;
            padding-top: 30px;
            border-top: 2px solid #e5e7eb;
        }
        
        .signature-box {
            text-align: center;
            width: 200px;
        }
        
        .signature-line {
            width: 150px;
            height: 2px;
            background: #374151;
            margin: 0 auto 15px auto;
        }
        
        .signature-label {
            font-size: 14px;
            color: #6b7280;
            font-weight: 500;
        }
        
        .footer {
            margin-top: 40px;
            text-align: center;
            color: #6b7280;
            font-size: 12px;
            border-top: 1px solid #e5e7eb;
            padding-top: 20px;
        }
        
        @media print {
            body { margin: 0; padding: 0; }
            .container { max-width: none; }
            .header { break-inside: avoid; }
            table { break-inside: avoid; }
            .summary { break-inside: avoid; }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <img src="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIwIiBoZWlnaHQ9IjEyMCIgdmlld0JveD0iMCAwIDEyMCAxMjAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxMjAiIGhlaWdodD0iMTIwIiByeD0iMTIiIGZpbGw9IiMyNTYzZWIiLz4KPHN2ZyB4PSIzMCIgeT0iMzAiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgo8cGF0aCBkPSJNMTIgMkMxMy4wOTEgMiAxNCAyLjkwOSAxNCA0VjZIMTZWNEMxNiAyLjkwOSAxNy4wOTEgMiAxOCAyQzE5LjA5MSAyIDIwIDIuOTA5IDIwIDRWNkgxOFY4QzE4IDkuMTA5IDE3LjA5MSAxMCAxNiAxMEg4QzYuOTA5IDEwIDYgOS4xMDkgNiA4VjZINEMyLjkwOSA2IDIgNS4wOTEgMiA0QzIgMi45MDkgMi45MDkgMiA0IDJINiA0VjJIMTJaIiBmaWxsPSJ3aGl0ZSIvPgo8cGF0aCBkPSJNMTIgMTJDMTAuMzQzIDEyIDkgMTMuMzQzIDkgMTVWMTdIMTVWMTVDMTUgMTMuMzQzIDEzLjY1NyAxMiAxMiAxMloiIGZpbGw9IndoaXRlIi8+Cjwvc3ZnPgo8L3N2Zz4K" alt="Logo" class="logo">
            <h1>ใบเสนอราคา</h1>
            <p>Quotation</p>
        </div>

        <div class="company-info">
            <div class="info-section">
                <h3>ข้อมูลบริษัท</h3>
                <p><strong>บริษัท วินริช ไดนามิก จำกัด</strong></p>
                <p>123 ถนนสุขุมวิท แขวงคลองเตย</p>
                <p>เขตคลองเตย กรุงเทพฯ 10110</p>
                <p>โทร: 02-123-4567</p>
                <p>อีเมล: info@winrichdynamic.com</p>
            </div>
            <div class="info-section">
                <h3>ข้อมูลลูกค้า</h3>
                <p><strong>${sanitizedQuotation.customerName}</strong></p>
                ${sanitizedQuotation.customerTaxId ? `<p>เลขประจำตัวผู้เสียภาษี: ${sanitizedQuotation.customerTaxId}</p>` : ''}
                ${sanitizedQuotation.customerAddress ? `<p>ที่อยู่: ${sanitizedQuotation.customerAddress}</p>` : ''}
                ${sanitizedQuotation.customerPhone ? `<p>โทร: ${sanitizedQuotation.customerPhone}</p>` : ''}
            </div>
        </div>

        <div class="quotation-details">
            <div class="detail-item">
                <div class="label">เลขที่ใบเสนอราคา</div>
                <div class="value">${sanitizedQuotation.quotationNumber}</div>
            </div>
            <div class="detail-item">
                <div class="label">วันที่สร้าง</div>
                <div class="value">${formatDate(sanitizedQuotation.createdAt)}</div>
            </div>
            <div class="detail-item">
                <div class="label">วันหมดอายุ</div>
                <div class="value">${formatDate(sanitizedQuotation.validUntil)}</div>
            </div>
        </div>

        <div class="subject">${sanitizedQuotation.subject}</div>

        <table>
            <thead>
                <tr>
                    <th>รายการ</th>
                    <th>รายละเอียด</th>
                    <th class="text-center">จำนวน</th>
                    <th class="text-center">หน่วย</th>
                    <th class="text-right">ราคาต่อหน่วย</th>
                    <th class="text-center">ส่วนลด</th>
                    <th class="text-right">ราคารวม</th>
                </tr>
            </thead>
            <tbody>
                ${sanitizedQuotation.items.map((item: any) => `
                    <tr>
                        <td><strong>${item.productName}</strong></td>
                        <td>${item.description || '-'}</td>
                        <td class="text-center">${item.quantity.toLocaleString()}</td>
                        <td class="text-center">${item.unit}</td>
                        <td class="text-right">${formatCurrency(item.unitPrice)}</td>
                        <td class="text-center">${item.discount > 0 ? item.discount + '%' : '-'}</td>
                        <td class="text-right"><strong>${formatCurrency(item.totalPrice)}</strong></td>
                    </tr>
                `).join('')}
            </tbody>
        </table>

        <div class="summary">
            <div class="summary-table">
                <div class="row">
                    <span>ราคารวม:</span>
                    <span>${formatCurrency(sanitizedQuotation.subtotal)}</span>
                </div>
                <div class="row">
                    <span>ส่วนลดรวม:</span>
                    <span>${formatCurrency(sanitizedQuotation.totalDiscount)}</span>
                </div>
                <div class="row">
                    <span>ราคาหลังหักส่วนลด:</span>
                    <span>${formatCurrency(sanitizedQuotation.totalAmount)}</span>
                </div>
                <div class="row">
                    <span>ภาษีมูลค่าเพิ่ม (${sanitizedQuotation.vatRate}%):</span>
                    <span>${formatCurrency(sanitizedQuotation.vatAmount)}</span>
                </div>
                <div class="row total">
                    <span>ราคารวมทั้งสิ้น:</span>
                    <span>${formatCurrency(sanitizedQuotation.grandTotal)}</span>
                </div>
            </div>
        </div>

        <div class="terms">
            <div>
                <h3>เงื่อนไขการชำระเงิน</h3>
                <p>${sanitizedQuotation.paymentTerms}</p>
            </div>
            ${sanitizedQuotation.deliveryTerms ? `
                <div>
                    <h3>เงื่อนไขการส่งมอบ</h3>
                    <p>${sanitizedQuotation.deliveryTerms}</p>
                </div>
            ` : ''}
        </div>

        ${sanitizedQuotation.notes ? `
            <div class="notes">
                <h3>หมายเหตุ</h3>
                <p>${sanitizedQuotation.notes}</p>
            </div>
        ` : ''}

        <div class="signatures">
            <div class="signature-box">
                <div class="signature-line"></div>
                <div class="signature-label">ลายเซ็นลูกค้า</div>
                <div class="signature-label">(Customer Signature)</div>
            </div>
            <div class="signature-box">
                <div class="signature-line"></div>
                <div class="signature-label">ลายเซ็นผู้เสนอราคา</div>
                <div class="signature-label">(Authorized Signature)</div>
            </div>
        </div>

        <div class="footer">
            <p>ใบเสนอราคานี้มีผลบังคับใช้จนถึงวันที่ ${formatDate(sanitizedQuotation.validUntil)}</p>
            <p>Generated by WinRich Dynamic Service - ${new Date().toLocaleDateString('th-TH')}</p>
        </div>
    </div>
</body>
</html>
  `;
  } catch (error) {
    console.error('Error generating HTML:', error);
    // Fallback: สร้าง HTML แบบง่าย
    return `
<!DOCTYPE html>
<html lang="th">
<head>
    <meta charset="UTF-8">
    <title>ใบเสนอราคา</title>
    <style>
        body { font-family: Arial, sans-serif; padding: 20px; }
        .error { color: red; }
    </style>
</head>
<body>
    <h1>ใบเสนอราคา</h1>
    <p class="error">เกิดข้อผิดพลาดในการสร้าง PDF</p>
    <p>กรุณาลองใหม่อีกครั้ง</p>
</body>
</html>
    `;
  }
}
