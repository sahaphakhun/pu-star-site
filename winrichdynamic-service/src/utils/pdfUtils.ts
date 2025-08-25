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
    // แปลงเป็น string
    let cleanStr = String(str);
    
    // ลบ control characters และ replacement characters
    cleanStr = cleanStr
      .replace(/[\u0000-\u001F\u007F-\u009F]/g, '')
      .replace(/[\uFFFD]/g, '')
      .trim();
    
    // ตรวจสอบว่าเป็น string ที่ถูกต้อง
    if (cleanStr.length === 0) return '';
    
    // ใช้วิธีที่ง่ายกว่า: ตรวจสอบว่าเป็น ASCII หรือ Thai characters เท่านั้น
    const safeChars = /^[\u0E00-\u0E7F\u0020-\u007E]*$/;
    if (safeChars.test(cleanStr)) {
      return cleanStr;
    }
    
    // ถ้าไม่ปลอดภัย ให้ลบตัวอักษรที่ไม่ได้กำหนด
    return cleanStr.replace(/[^\u0E00-\u0E7F\u0020-\u007E]/g, '');
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
    await new Promise(resolve => setTimeout(resolve, 3000));
    
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
  <meta charset="UTF-8" />
    <title>ใบเสนอราคา ${sanitizedQuotation.quotationNumber}</title>
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Sarabun:wght@300;400;600;700&display=swap" rel="stylesheet">
    <style>
    :root{
      --brand:#1779c4; --ink:#0F172A; --muted:#475569; --border:#E2E8F0; --panel:#F8FAFC;
    }
    *{ box-sizing:border-box; }
    html,body{ margin:0; padding:0; }
    body{
      font-family:'Sarabun','Tahoma','Noto Sans Thai','DejaVu Sans',sans-serif;
      color:var(--ink); background:#fff; -webkit-print-color-adjust:exact;
    }
    @page{ size:A4; margin:18mm; }

    .wrap{ padding:0; }

    /* Header: logo top-left, legal block, meta right */
    .header{
      display:grid; grid-template-columns:1.5fr 1fr; gap:16px;
      padding-bottom:12px; border-bottom:2px solid var(--brand); margin-bottom:16px;
    }
    .id-block{ display:flex; gap:12px; align-items:flex-start; }
    .logo{ width:80px; height:auto; object-fit:contain; }
    .company{
      line-height:1.4;
    }
    .company-name{ font-size:18px; font-weight:700; color:var(--brand); }
    .company p{ margin:2px 0; font-size:12.5px; color:var(--muted); }

    .meta{
      border:1px solid var(--border); border-radius:4px; padding:10px;
      align-self:start; font-size:12.5px;
    }
    .meta h1{ margin:0 0 6px 0; font-size:18px; color:var(--ink); letter-spacing:.3px; }
    .row{ display:flex; justify-content:space-between; gap:12px; padding:4px 0; border-top:1px solid var(--border); }
    .row:first-of-type{ border-top:none; }
    .label{ color:var(--muted); }
    .value{ font-weight:600; color:var(--ink); }

    /* Panels */
    .grid-2{ display:grid; grid-template-columns:1fr 1fr; gap:12px; margin:0 0 14px; }
    .panel{
      background:var(--panel); border:1px solid var(--border); border-left:4px solid var(--brand);
      border-radius:4px; padding:10px 12px;
    }
    .panel h3{ margin:0 0 6px; font-size:13.5px; color:var(--brand); }
    .panel p{ margin:3px 0; font-size:12.5px; }

    /* Subject rule */
    .subject{
      border-left:3px solid var(--brand); padding:8px 12px; background:#FFFFFF; margin:8px 0 12px;
      font-size:15px; font-weight:600;
    }

    /* Table */
    table{ width:100%; border-collapse:collapse; font-size:12.5px; margin:10px 0 12px; }
    thead{ display:table-header-group; }
    th,td{ border:1px solid var(--border); padding:8px; vertical-align:top; }
    th{
      background:var(--brand); color:#fff; font-weight:600; font-size:12px;
    }
    tbody tr:nth-child(even) td{ background:#FAFAFA; }
    td.no{ width:34px; text-align:center; }
    td.item .name{ font-weight:600; }
    td.item .desc{ color:var(--muted); font-size:11.5px; margin-top:2px; }
    td.qty, td.unit, td.disc{ text-align:center; white-space:nowrap; }
    td.price, td.lineTotal{ text-align:right; white-space:nowrap; }

    /* Totals */
    .summary{ display:flex; justify-content:flex-end; }
    .totals{
      width:340px; border:1px solid var(--border); border-radius:4px; padding:10px 12px; background:#fff;
    }
    .trow{ display:flex; justify-content:space-between; padding:6px 0; font-size:12px; }
    .grand{ margin-top:6px; padding-top:8px; border-top:2px solid var(--brand); font-weight:700; color:var(--brand); font-size:12px; }

    /* Terms + Bank */
    .flex{ display:flex; gap:12px; align-items:flex-start; }
    .bank th,.bank td{ font-size:12px; }

    /* Signatures */
    .sign{ display:flex; justify-content:space-between; margin-top:20px; padding-top:12px; border-top:1px solid var(--border); }
    .sig{ width:46%; }
    .sig .line{ height:1.5px; background:#334155; margin:28px 0 6px; }
    .sig .cap{ font-size:12px; color:var(--muted); }
    .sig .name{ font-size:12.5px; }

    /* Footer */
    .footer{ margin-top:14px; text-align:center; color:var(--muted); font-size:11px; border-top:1px solid var(--border); padding-top:8px; }
    </style>
</head>
<body>
  <div class="wrap">
    <!-- Header -->
        <div class="header">
      <div class="id-block">
        <img class="logo" alt="Logo"
             src="/winrich-logo.png" />
        <div class="company">
          <div class="company-name">บริษัท วินริช ไดนามิก จำกัด</div>
          <p>123 ถนนสุขุมวิท แขวงคลองเตย เขตวัฒนา กรุงเทพฯ 10110</p>
          <p>เลขผู้เสียภาษี: 0105563000000 · โทร 02-123-4567 · info@winrichdynamic.com</p>
          <p>เว็บไซต์: winrichdynamic.com</p>
        </div>
      </div>
      <div class="meta">
        <h1>ใบเสนอราคา (Quotation)</h1>
        <div class="row"><div class="label">เลขที่</div><div class="value">${sanitizedQuotation.quotationNumber}</div></div>
        <div class="row"><div class="label">วันที่ออก</div><div class="value">${formatDate(sanitizedQuotation.createdAt)}</div></div>
        <div class="row"><div class="label">วันหมดอายุ</div><div class="value">${formatDate(sanitizedQuotation.validUntil)}</div></div>
      </div>
        </div>

    <!-- Parties -->
    <div class="grid-2">
      <div class="panel">
        <h3>ผู้เสนอราคา (Seller)</h3>
                <p><strong>บริษัท วินริช ไดนามิก จำกัด</strong></p>
        <p>ที่อยู่ตามด้านบน</p>
            </div>
      <div class="panel">
        <h3>ผู้รับใบเสนอราคา (Customer)</h3>
                <p><strong>${sanitizedQuotation.customerName}</strong></p>
                ${sanitizedQuotation.customerTaxId ? `<p>เลขประจำตัวผู้เสียภาษี: ${sanitizedQuotation.customerTaxId}</p>` : ''}
                ${sanitizedQuotation.customerAddress ? `<p>ที่อยู่: ${sanitizedQuotation.customerAddress}</p>` : ''}
                ${sanitizedQuotation.customerPhone ? `<p>โทร: ${sanitizedQuotation.customerPhone}</p>` : ''}
            </div>
        </div>

    <!-- Subject -->
        <div class="subject">${sanitizedQuotation.subject}</div>

    <!-- Items -->
        <table>
            <thead>
                <tr>
          <th style="width:34px">#</th>
          <th>รายละเอียดรายการ</th>
          <th style="width:80px">จำนวน</th>
          <th style="width:70px">หน่วย</th>
          <th style="width:110px">ราคาต่อหน่วย</th>
          <th style="width:70px">ส่วนลด</th>
          <th style="width:120px">ราคารวม</th>
                </tr>
            </thead>
            <tbody>
        ${sanitizedQuotation.items.map((item: any, index: number) => `
          <tr>
            <td class="no">${index + 1}</td>
            <td class="item">
              <div class="name">${item.productName}</div>
              ${item.description ? `<div class="desc">${item.description}</div>` : ''}
            </td>
            <td class="qty">${item.quantity.toLocaleString()}</td>
            <td class="unit">${item.unit}</td>
            <td class="price">${formatCurrency(item.unitPrice)}</td>
            <td class="disc">${item.discount > 0 ? item.discount + '%' : '0%'}</td>
            <td class="lineTotal">${formatCurrency(item.totalPrice)}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>

    <!-- Totals -->
        <div class="summary">
      <div class="totals">
        <div class="trow"><span>ราคารวม</span><span>${formatCurrency(sanitizedQuotation.subtotal)}</span></div>
        <div class="trow"><span>ส่วนลดรวม</span><span>${formatCurrency(sanitizedQuotation.totalDiscount)}</span></div>
        <div class="trow"><span>ราคาหลังหักส่วนลด</span><span>${formatCurrency(sanitizedQuotation.totalAmount)}</span></div>
        <div class="trow"><span>ภาษีมูลค่าเพิ่ม (${sanitizedQuotation.vatRate}%)</span><span>${formatCurrency(sanitizedQuotation.vatAmount)}</span></div>
        <div class="trow grand"><span>ราคารวมทั้งสิ้น</span><span>${formatCurrency(sanitizedQuotation.grandTotal)}</span></div>
            </div>
        </div>

    <!-- Terms + Bank -->
    <div class="flex" style="margin-top:10px;">
      <div class="panel" style="flex:1;">
        <h3>เงื่อนไขและการส่งมอบ</h3>
                <p>${sanitizedQuotation.paymentTerms}</p>
        ${sanitizedQuotation.deliveryTerms ? `<p>${sanitizedQuotation.deliveryTerms}</p>` : ''}
        <p>ราคาไม่รวมโดเมน โฮสติ้ง และค่าบริการบุคคลที่สาม</p>
            </div>
      <div class="panel" style="flex:1;">
        <h3>ข้อมูลบัญชีสำหรับชำระเงิน</h3>
        <table class="bank" style="width:100%; border-collapse:collapse;">
          <thead>
            <tr>
              <th style="border:1px solid var(--border); padding:6px;">ธนาคาร</th>
              <th style="border:1px solid var(--border); padding:6px;">ชื่อบัญชี</th>
              <th style="border:1px solid var(--border); padding:6px;">เลขที่บัญชี</th>
              <th style="border:1px solid var(--border); padding:6px;">สาขา</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style="border:1px solid var(--border); padding:6px;">กสิกรไทย</td>
              <td style="border:1px solid var(--border); padding:6px;">บริษัท วินริช ไดนามิก จำกัด</td>
              <td style="border:1px solid var(--border); padding:6px;">123-4-56789-0</td>
              <td style="border:1px solid var(--border); padding:6px;">อโศก</td>
            </tr>
          </tbody>
        </table>
                </div>
        </div>

    <!-- Signatures -->
    <div class="sign">
      <div class="sig">
        <div class="line"></div>
        <div class="name">ลายเซ็นผู้รับใบเสนอราคา / วันที่</div>
        <div class="cap">(Customer Signature / Date)</div>
            </div>
      <div class="sig">
        <div class="line"></div>
        <div class="name">ลายเซ็นผู้มีอำนาจ / วันที่</div>
        <div class="cap">(Authorized Signature / Date)</div>
            </div>
        </div>

    <!-- Footer -->
        <div class="footer">
      ใบเสนอราคานี้มีผลถึง ${formatDate(sanitizedQuotation.validUntil)} · WinRich Dynamic Service
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
