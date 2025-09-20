import type { QuotationData } from './pdfUtils';

function sanitizeString(str: any): string {
  if (!str) return '';
  try {
    let s = String(str)
      .replace(/[\u0000-\u001F\u007F-\u009F]/g, '')
      .replace(/[\uFFFD]/g, '')
      .trim();
    const safe = /^[\u0E00-\u0E7F\u0020-\u007E]*$/;
    if (!safe.test(s)) s = s.replace(/[^\u0E00-\u0E7F\u0020-\u007E]/g, '');
    return s;
  } catch {
    return String(str).replace(/[^\u0E00-\u0E7F\u0020-\u007E]/g, '');
  }
}

function sanitizeQuotationData(quotation: any): any {
  const sanitizeArray = (arr: any[]): any[] => {
    if (!Array.isArray(arr)) return [];
    return arr.map(item => ({
      ...item,
      productName: sanitizeString(item.productName),
      description: sanitizeString(item.description),
      unit: sanitizeString(item.unit),
      selectedOptions: (() => {
        if (!item.selectedOptions || typeof item.selectedOptions !== 'object') return undefined;
        const entries = Object.entries(item.selectedOptions).filter(([, value]) => Boolean(value));
        if (!entries.length) return undefined;
        return Object.fromEntries(entries.map(([key, value]) => [sanitizeString(key), sanitizeString(value)]));
      })()
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
    items: sanitizeArray(quotation.items || []),
    companyName: sanitizeString(quotation.companyName),
    companyAddress: sanitizeString(quotation.companyAddress),
    companyPhone: sanitizeString(quotation.companyPhone),
    companyEmail: sanitizeString(quotation.companyEmail),
    companyWebsite: sanitizeString(quotation.companyWebsite),
    taxId: sanitizeString(quotation.taxId),
    bankInfo: quotation.bankInfo ? {
      bankName: sanitizeString(quotation.bankInfo.bankName),
      accountName: sanitizeString(quotation.bankInfo.accountName),
      accountNumber: sanitizeString(quotation.bankInfo.accountNumber),
      branch: sanitizeString(quotation.bankInfo.branch),
    } : undefined
  };
}

function bahtText(amount: number): string {
  const thNum = ['ศูนย์','หนึ่ง','สอง','สาม','สี่','ห้า','หก','เจ็ด','แปด','เก้า'];
  const thUnit = ['','สิบ','ร้อย','พัน','หมื่น','แสน','ล้าน'];
  const toText = (n: number): string => {
    if (n === 0) return '';
    let s = '';
    let i = 0;
    while (n > 0) {
      const d = n % 10;
      if (d !== 0) {
        let w = thNum[d];
        if (i === 0 && d === 1 && s !== '') w = 'เอ็ด';
        if (i === 1 && d === 1) w = '';
        if (i === 1 && d === 2) w = 'ยี่';
        s = `${w}${thUnit[i]}${s}`;
      }
      i++; n = Math.floor(n / 10);
    }
    return s;
  };
  const splitMillion = (n: number): number[] => {
    const parts: number[] = [];
    while (n > 0) { parts.unshift(n % 1000000); n = Math.floor(n / 1000000); }
    return parts.length ? parts : [0];
  };
  const amt = Math.round((amount || 0) * 100) / 100;
  const baht = Math.floor(amt);
  const satang = Math.round((amt - baht) * 100);
  const bahtStr = baht === 0 ? thNum[0] : splitMillion(baht).map(toText).join('ล้าน');
  const satangStr = satang === 0 ? 'ถ้วน' : splitMillion(satang).map(toText).join('ล้าน') + 'สตางค์';
  return `${bahtStr}บาท${satangStr}`;
}

export function generateQuotationHTML(quotation: QuotationData): string {
  try {
    const q = sanitizeQuotationData(quotation);
    const logoUrl = q.logoUrl || '';
    const companyName = q.companyName || 'บริษัท วินริช ไดนามิก จำกัด';
    const companyAddress = q.companyAddress || '123 ถนนสุขุมวิท แขวงคลองเตย เขตวัฒนา กรุงเทพฯ 10110';
    const companyPhone = q.companyPhone || '02-123-4567';
    const companyEmail = q.companyEmail || 'info@winrichdynamic.com';
    const companyWebsite = q.companyWebsite || 'winrichdynamic.com';
    const companyTaxId = q.taxId || '0105563000000';
    const bank = q.bankInfo || { bankName: 'กสิกรไทย', accountName: companyName, accountNumber: '123-4-56789-0', branch: 'อโศก' };
    const salesName = (quotation as any).salesName || '';
    const salesPhone = (quotation as any).salesPhone || '';
    const salesEmail = (quotation as any).salesEmail || '';

    const showUnitDiscount = Array.isArray(q.items) && q.items.some((it: any) => Number(it.discount) > 0);

    const PER_PAGE = 17;
    const LAST_PAGE = 7;
    const items = q.items || [];
    const pages: any[][] = [];
    if (items.length <= LAST_PAGE) {
      pages.push(items);
    } else {
      const last = items.slice(items.length - LAST_PAGE);
      let rem = items.slice(0, items.length - LAST_PAGE);
      while (rem.length) { pages.push(rem.slice(0, PER_PAGE)); rem = rem.slice(PER_PAGE); }
      pages.push(last);
    }
    const totalPages = Math.max(1, pages.length);

    const fmt = (n: number) => (Number(n || 0)).toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const thDate = (d: string | Date) => new Date(d).toLocaleDateString('th-TH', { year:'numeric', month:'long', day:'numeric' });
    const amountInWords = bahtText(Number(q.grandTotal) || 0);

    return `
<!DOCTYPE html>
<html lang="th">
<head>
  <meta charset="UTF-8" />
  <title>ใบเสนอราคา ${q.quotationNumber}</title>
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+Thai:wght@400;600&display=swap" rel="stylesheet">
  <style>
    :root{ --primary:#0F4D8B; --primaryMid:#4574A2; --primaryLight:#B0C6D7; --text:#111; --muted:#A3A4A4; --bg:#FCFCFC; --border:#E5E7EB; --gutter:5mm; }
    *{ box-sizing:border-box; }
    html,body{ margin:0; padding:0; }
    body{ font-family:'Noto Sans Thai','Tahoma','DejaVu Sans',sans-serif; font-size:11pt; color:var(--text); -webkit-print-color-adjust:exact; font-variant-numeric:tabular-nums; font-feature-settings:'tnum' 1; }
    @page{ size:A4; margin: 16mm 16mm 16mm 16mm; }
    .doc{ display:block; }
    .page{ position:relative; page-break-after:always; }
    .page:last-child{ page-break-after:auto; }
    .content{ position:relative; z-index:1; }
    .topbar{ display:grid; grid-template-columns:7fr 5fr; gap: var(--gutter); }
    .companyBlock{ display:flex; gap:10px; align-items:flex-start; }
    .logo{ height:24px; width:auto; object-fit:contain; margin-top:2px; }
    .companyName{ font-size:14pt; font-weight:600; color:var(--primary); }
    .companyLines p{ margin:1px 0; font-size:10.5pt; color:#333; }
    .docTitle{ text-align:right; font-size:30pt; font-weight:600; color:#111; }
    .infoGrid{ display:grid; grid-template-columns:7fr 5fr; gap: var(--gutter); margin-top:6mm; }
    .ibox{ border:1px solid var(--border); border-radius:4px; padding:6px 8px; }
    .ibox h4{ margin:0 0 4px; font-size:12pt; font-weight:600; color:var(--primary); }
    .row{ display:flex; gap:8px; margin:2px 0; }
    .row .k{ min-width:28%; color:#444; font-weight:600; font-size:10.5pt; }
    .row .v{ flex:1; color:#222; font-size:10.5pt; }
    table{ width:100%; border-collapse:collapse; margin-top:6mm; }
    thead{ display:table-header-group; }
    th,td{ border:1px solid var(--primaryLight); padding:6px; font-size:10.5pt; }
    /* Reduce header row height while keeping font-size */
    thead th{ background:var(--primary); color:#fff; height:24px; padding-top:4px; padding-bottom:4px; }
    td.no{ width:7%; text-align:center; }
    td.desc{ width:45%; }
    td.sku{ width:13%; text-align:center; color:#333; }
    td.qty{ width:9%; text-align:right; }
    td.unit{ width:8%; text-align:center; }
    td.price{ width:13%; text-align:right; }
    td.disc{ width:13%; text-align:right; }
    td.amount{ width:16%; text-align:right; font-weight:600; }
    .note{ color:var(--primaryMid); font-size:9.5pt; margin-top:2px; }
    .totalsWrap{ display:flex; justify-content:flex-end; margin-top:6mm; page-break-inside:avoid; }
    .totals{ width:60%; max-width:420px; }
    .tline{ display:flex; justify-content:space-between; padding:4px 0; }
    .grand{ margin-top:4px; padding-top:6px; border-top:2px solid var(--primary); font-weight:700; color:var(--primary); font-size:12pt; }
    .amountText{ text-align:right; color:var(--muted); font-size:9pt; margin-top:2mm; }
    .nbGrid{ display:grid; grid-template-columns:6fr 6fr; gap: var(--gutter); margin-top:6mm; }
    .nbox{ border:1px solid var(--border); border-radius:4px; padding:6px 8px; }
    .nbox h5{ margin:0 0 4px; font-size:11pt; color:var(--primary); }
    .nbox p{ margin:2px 0; font-size:10pt; color:#333; }
    .sigs{ display:grid; grid-template-columns:repeat(3, 1fr); gap: var(--gutter); margin-top:6mm; page-break-inside:avoid; }
    .sigBox{ border:1px solid var(--primaryLight); height: 36mm; padding:6px; display:flex; flex-direction:column; justify-content:flex-end; }
    .sigName{ text-align:center; font-weight:600; }
    .sigRole{ text-align:center; color:#666; font-size:10pt; }
    .sigDate{ text-align:center; color:#666; font-size:9.5pt; margin-top:2mm; }
    .footer{ display:flex; justify-content:space-between; align-items:center; margin-top:6mm; color:#666; font-size:9.5pt; }
  </style>
</head>
<body>
  <div class="doc">
    ${pages.map((chunk, pi) => {
      const isLast = (pi === totalPages - 1);
      const beforeCount = pi > 0 ? pages.slice(0, pi).reduce((s,a)=>s+a.length,0) : 0;
      return `
      <section class="page">
        <div class="content">
          <div class="topbar">
            <div class="companyBlock">
              ${logoUrl ? `<img class="logo" src="${logoUrl}" alt="logo"/>` : ''}
              <div class="companyLines">
                <div class="companyName">${companyName}</div>
                <p>${companyAddress}</p>
                <p>เลขผู้เสียภาษี: ${companyTaxId}</p>
                <p>โทร ${companyPhone} · ${companyEmail}</p>
              </div>
            </div>
            <div class="docTitle">ใบเสนอราคา</div>
          </div>
          <div class="infoGrid">
            <div class="ibox">
              <h4>ผู้ซื้อ</h4>
              <div class="row"><div class="k">ชื่อลูกค้า</div><div class="v">${q.customerName}</div></div>
              ${q.customerTaxId ? `<div class="row"><div class="k">เลขผู้เสียภาษี</div><div class="v">${q.customerTaxId}</div></div>` : ''}
              ${q.customerAddress ? `<div class="row"><div class="k">ที่อยู่</div><div class="v">${q.customerAddress}</div></div>` : ''}
              ${(() => {
                if (q.shipToSameAsCustomer && q.customerAddress) {
                  return `<div class="row"><div class="k">ที่อยู่จัดส่ง</div><div class="v">ใช้ที่อยู่ลูกค้า</div></div>`;
                }
                if (!q.shipToSameAsCustomer && q.shippingAddress) {
                  return `<div class="row"><div class="k">ที่อยู่จัดส่ง</div><div class="v">${q.shippingAddress}</div></div>`;
                }
                return '';
              })()}
              ${q.customerPhone ? `<div class="row"><div class="k">โทร</div><div class="v">${q.customerPhone}</div></div>` : ''}
            </div>
            <div class="ibox">
              <h4>รายละเอียดเอกสาร</h4>
              <div class="row"><div class="k">เลขที่</div><div class="v">${q.quotationNumber}</div></div>
              <div class="row"><div class="k">วันที่</div><div class="v">${thDate(q.createdAt)}</div></div>
              <div class="row"><div class="k">วันยืนราคา</div><div class="v">${thDate(q.validUntil)}</div></div>
              <div class="row"><div class="k">เครดิต</div><div class="v">${q.paymentTerms || '-'}</div></div>
              ${salesName ? `<div class="row"><div class="k">ฝ่ายขาย</div><div class="v">${salesName}</div></div>` : ''}
              ${salesPhone ? `<div class="row"><div class="k">เบอร์</div><div class="v">${salesPhone}</div></div>` : ''}
              ${salesEmail ? `<div class="row"><div class="k">อีเมล</div><div class="v">${salesEmail}</div></div>` : ''}
            </div>
          </div>
          ${pi === 0 ? `<div class=\"ibox\" style=\"margin-top:4mm;\"><div class=\"row\"><div class=\"k\">โครงการ</div><div class=\"v\">${q.subject || '-'}</div></div></div>` : ''}
          <table>
            <thead>
              <tr>
                <th>ลำดับ</th>
                <th>รายละเอียด</th>
                <th>SKU</th>
                <th>จำนวน</th>
                <th>หน่วย</th>
                <th>ราคา/หน่วย</th>
                ${showUnitDiscount ? '<th>ส่วนลด/หน่วย</th>' : ''}
                <th>มูลค่า</th>
              </tr>
            </thead>
            <tbody>
              ${chunk.map((item:any, i:number) => `
                <tr>
                  <td class=\"no\">${beforeCount + i + 1}</td>
                  <td class=\"desc\">
                    <div>${item.productName || '-'}</div>
                    ${item.description ? `<div class=\"note\">${item.description}</div>` : ''}
                    ${(() => {
                      const opts = item.selectedOptions && typeof item.selectedOptions === 'object'
                        ? Object.entries(item.selectedOptions).filter(([, value]) => Boolean(value))
                        : [];
                      if (!opts.length) return '';
                      const text = opts.map(([name, value]) => `${sanitizeString(name)}: ${sanitizeString(value)}`).join(' · ');
                      return `<div class=\"note\">${text}</div>`;
                    })()}
                  </td>
                  <td class=\"sku\">${sanitizeString((item as any).sku) || sanitizeString(item.productId) || '-'}</td>
                  <td class=\"qty\">${Number(item.quantity||0).toLocaleString()}</td>
                  <td class=\"unit\">${sanitizeString(item.unit)||'-'}</td>
                  <td class=\"price\">${fmt(item.unitPrice||0)}</td>
                  ${showUnitDiscount ? `<td class=\"disc\">${Number(item.discount||0).toFixed(0)}%</td>` : ''}
                  <td class=\"amount\">${fmt(item.totalPrice||0)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          ${isLast ? `
          <div class=\"totalsWrap\">
            <div class=\"totals\">
              <div class=\"tline\"><div>รวมเป็นเงิน</div><div>${fmt(q.subtotal)}</div></div>
              <div class=\"tline\"><div>หักส่วนลด</div><div>${fmt(q.totalDiscount)}</div></div>
              <div class=\"tline\"><div>ราคาหลังหักส่วนลด</div><div>${fmt(q.totalAmount)}</div></div>
              <div class=\"tline\"><div>VAT ${Number(q.vatRate||0).toFixed(0)}%</div><div>${fmt(q.vatAmount)}</div></div>
              <div class=\"tline grand\"><div>จำนวนเงินรวมทั้งสิ้น (THB)</div><div>${fmt(q.grandTotal)}</div></div>
              <div class=\"amountText\">${amountInWords}</div>
            </div>
          </div>
          <div class=\"nbGrid\">
            <div class=\"nbox\">
              <h5>หมายเหตุ</h5>
              <p>${q.notes || '-'}</p>
            </div>
            <div class=\"nbox\">
              <h5>ข้อมูลบัญชีสำหรับชำระเงิน</h5>
              <p>ธนาคาร: ${sanitizeString(bank.bankName)||'-'}</p>
              <p>ชื่อบัญชี: ${sanitizeString(bank.accountName)||'-'}</p>
              <p>เลขที่บัญชี: ${sanitizeString(bank.accountNumber)||'-'}</p>
              <p>สาขา: ${sanitizeString(bank.branch)||'-'}</p>
            </div>
          </div>
          <div class=\"sigs\">
            <div class=\"sigBox\"><div class=\"sigName\">ผู้เสนอราคา</div><div class=\"sigRole\">...........................................................</div><div class=\"sigDate\">วันที่: ........../........../..........</div></div>
            <div class=\"sigBox\"><div class=\"sigName\">ผู้อนุมัติใบเสนอราคา</div><div class=\"sigRole\">...........................................................</div><div class=\"sigDate\">วันที่: ........../........../..........</div></div>
            <div class=\"sigBox\"><div class=\"sigName\">ผู้ยืนยันการสั่งซื้อ</div><div class=\"sigRole\">...........................................................</div><div class=\"sigDate\">วันที่: ........../........../..........</div></div>
          </div>
          ` : ''}
          <div class=\"footer\">
            <div>สร้างโดยระบบ · ${companyWebsite}</div>
            <div>หน้า ${pi+1}/${totalPages}</div>
          </div>
        </div>
      </section>`
    }).join('')}
  </div>
</body>
</html>`;
  } catch (error) {
    console.error('Error generating HTML:', error);
    return `<!DOCTYPE html><html><body><p>PDF Error</p></body></html>`;
  }
}
