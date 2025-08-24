import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Quotation from '@/models/Quotation';

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
    
    // ส่งกลับเป็น HTML (สามารถแปลงเป็น PDF ได้ด้วย browser หรือ library อื่น)
    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html',
        'Content-Disposition': `attachment; filename="ใบเสนอราคา_${(quotation as any).quotationNumber || 'unknown'}.html"`
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

// ฟังก์ชันสร้าง HTML สำหรับใบเสนอราคา
function generateQuotationHTML(quotation: any): string {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('th-TH', {
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
    <title>ใบเสนอราคา ${quotation.quotationNumber}</title>
    <style>
        body {
            font-family: 'Sarabun', 'Noto Sans Thai', sans-serif;
            margin: 0;
            padding: 20px;
            background: white;
            color: #333;
        }
        .container {
            max-width: 800px;
            margin: 0 auto;
            background: white;
        }
        .header {
            text-align: center;
            border-bottom: 2px solid #333;
            padding-bottom: 20px;
            margin-bottom: 30px;
        }
        .header h1 {
            margin: 0;
            font-size: 28px;
            font-weight: bold;
        }
        .header p {
            margin: 5px 0;
            color: #666;
        }
        .company-info {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 40px;
            margin-bottom: 30px;
        }
        .info-section h3 {
            margin: 0 0 15px 0;
            font-size: 18px;
            font-weight: bold;
            color: #333;
        }
        .info-section p {
            margin: 5px 0;
            color: #555;
        }
        .quotation-details {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 20px;
            margin-bottom: 30px;
            background: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
        }
        .detail-item {
            text-align: center;
        }
        .detail-item .label {
            font-size: 12px;
            color: #666;
            margin-bottom: 5px;
        }
        .detail-item .value {
            font-size: 16px;
            font-weight: bold;
            color: #333;
        }
        .subject {
            font-size: 20px;
            font-weight: bold;
            margin-bottom: 30px;
            text-align: center;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 30px;
        }
        th, td {
            border: 1px solid #ddd;
            padding: 12px;
            text-align: left;
        }
        th {
            background: #f8f9fa;
            font-weight: bold;
            font-size: 14px;
        }
        td {
            font-size: 14px;
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
            width: 300px;
        }
        .summary-table .row {
            display: flex;
            justify-content: space-between;
            padding: 8px 0;
            border-bottom: 1px solid #eee;
        }
        .summary-table .total {
            font-weight: bold;
            font-size: 18px;
            border-top: 2px solid #333;
            padding-top: 15px;
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
            font-weight: bold;
        }
        .terms p {
            margin: 0;
            color: #555;
        }
        .notes {
            margin-bottom: 30px;
        }
        .notes h3 {
            margin: 0 0 15px 0;
            font-size: 16px;
            font-weight: bold;
        }
        .notes p {
            margin: 0;
            color: #555;
        }
        .signatures {
            display: flex;
            justify-content: space-between;
            margin-top: 50px;
        }
        .signature-box {
            text-align: center;
            width: 200px;
        }
        .signature-line {
            width: 150px;
            height: 2px;
            background: #333;
            margin: 0 auto 10px auto;
        }
        .signature-label {
            font-size: 14px;
            color: #666;
        }
        @media print {
            body { margin: 0; padding: 0; }
            .container { max-width: none; }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
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
                <p><strong>${quotation.customerName}</strong></p>
                ${quotation.customerTaxId ? `<p>เลขประจำตัวผู้เสียภาษี: ${quotation.customerTaxId}</p>` : ''}
                ${quotation.customerAddress ? `<p>ที่อยู่: ${quotation.customerAddress}</p>` : ''}
                ${quotation.customerPhone ? `<p>โทร: ${quotation.customerPhone}</p>` : ''}
            </div>
        </div>

        <div class="quotation-details">
            <div class="detail-item">
                <div class="label">เลขที่ใบเสนอราคา</div>
                <div class="value">${quotation.quotationNumber}</div>
            </div>
            <div class="detail-item">
                <div class="label">วันที่สร้าง</div>
                <div class="value">${formatDate(quotation.createdAt)}</div>
            </div>
            <div class="detail-item">
                <div class="label">วันหมดอายุ</div>
                <div class="value">${formatDate(quotation.validUntil)}</div>
            </div>
        </div>

        <div class="subject">${quotation.subject}</div>

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
                ${quotation.items.map((item: any) => `
                    <tr>
                        <td>${item.productName}</td>
                        <td>${item.description || ''}</td>
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
                    <span>${formatCurrency(quotation.subtotal)}</span>
                </div>
                <div class="row">
                    <span>ส่วนลดรวม:</span>
                    <span>${formatCurrency(quotation.totalDiscount)}</span>
                </div>
                <div class="row">
                    <span>ราคาหลังหักส่วนลด:</span>
                    <span>${formatCurrency(quotation.totalAmount)}</span>
                </div>
                <div class="row">
                    <span>ภาษีมูลค่าเพิ่ม (${quotation.vatRate}%):</span>
                    <span>${formatCurrency(quotation.vatAmount)}</span>
                </div>
                <div class="row total">
                    <span>ราคารวมทั้งสิ้น:</span>
                    <span>${formatCurrency(quotation.grandTotal)}</span>
                </div>
            </div>
        </div>

        <div class="terms">
            <div>
                <h3>เงื่อนไขการชำระเงิน</h3>
                <p>${quotation.paymentTerms}</p>
            </div>
            ${quotation.deliveryTerms ? `
                <div>
                    <h3>เงื่อนไขการส่งมอบ</h3>
                    <p>${quotation.deliveryTerms}</p>
                </div>
            ` : ''}
        </div>

        ${quotation.notes ? `
            <div class="notes">
                <h3>หมายเหตุ</h3>
                <p>${quotation.notes}</p>
            </div>
        ` : ''}

        <div class="signatures">
            <div class="signature-box">
                <div class="signature-line"></div>
                <div class="signature-label">ลายเซ็นลูกค้า</div>
            </div>
            <div class="signature-box">
                <div class="signature-line"></div>
                <div class="signature-label">ลายเซ็นผู้เสนอราคา</div>
            </div>
        </div>
    </div>
</body>
</html>
  `;
}
