export interface SalesOrderPdfData {
  salesOrderNumber?: string;
  orderDate?: string | Date;
  customerName?: string;
  customerPhone?: string;
  customerAddress?: string;
  deliveryAddress?: string;
  deliveryProvince?: string;
  deliveryDistrict?: string;
  deliverySubdistrict?: string;
  deliveryPostalCode?: string;
  paymentTerms?: string;
  notes?: string;
  items?: Array<{
    name?: string;
    description?: string;
    quantity?: number;
    unitLabel?: string;
    unitPrice?: number;
    discount?: number;
    amount?: number;
  }>;
  subtotal?: number;
  vatRate?: number;
  vatAmount?: number;
  totalAmount?: number;
  companyName?: string;
  companyAddress?: string;
  companyPhone?: string;
  companyEmail?: string;
  taxId?: string;
  logoUrl?: string;
}

export interface SalesOrderSignature {
  sellerName?: string;
  sellerSignatureUrl?: string;
  sellerPosition?: string;
  approverName?: string;
  approverSignatureUrl?: string;
  approverPosition?: string;
}

const sanitizeString = (value: any): string => {
  if (!value) return '';
  return String(value)
    .replace(/[\u0000-\u001F\u007F-\u009F]/g, '')
    .replace(/[\uFFFD]/g, '')
    .trim();
};

const fmtNumber = (value?: number) =>
  Number(value || 0).toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const formatDate = (value?: string | Date) => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' });
};

const joinAddress = (base?: string, parts?: string[]) => {
  const cleaned = (parts || []).map((part) => part?.trim()).filter(Boolean) as string[];
  const suffix = cleaned.length ? ` ${cleaned.join(' ')}` : '';
  return `${base || ''}${suffix}`.trim();
};

export function generateSalesOrderHTML(order: SalesOrderPdfData, signatures?: SalesOrderSignature): string {
  const data = {
    salesOrderNumber: sanitizeString(order.salesOrderNumber),
    customerName: sanitizeString(order.customerName),
    customerPhone: sanitizeString(order.customerPhone),
    customerAddress: sanitizeString(order.customerAddress),
    deliveryAddress: sanitizeString(order.deliveryAddress),
    deliveryProvince: sanitizeString(order.deliveryProvince),
    deliveryDistrict: sanitizeString(order.deliveryDistrict),
    deliverySubdistrict: sanitizeString(order.deliverySubdistrict),
    deliveryPostalCode: sanitizeString(order.deliveryPostalCode),
    paymentTerms: sanitizeString(order.paymentTerms),
    notes: sanitizeString(order.notes),
    companyName: sanitizeString(order.companyName) || 'บริษัท วินริช ไดนามิก จำกัด',
    companyAddress: sanitizeString(order.companyAddress) || '123 ถนนสุขุมวิท แขวงคลองเตย เขตวัฒนา กรุงเทพฯ 10110',
    companyPhone: sanitizeString(order.companyPhone) || '02-123-4567',
    companyEmail: sanitizeString(order.companyEmail) || 'info@winrichdynamic.com',
    taxId: sanitizeString(order.taxId) || '0105563000000',
    logoUrl: sanitizeString(order.logoUrl),
  };

  const shippingAddress = joinAddress(data.deliveryAddress, [
    data.deliverySubdistrict ? `ต.${data.deliverySubdistrict}` : '',
    data.deliveryDistrict ? `อ.${data.deliveryDistrict}` : '',
    data.deliveryProvince ? `จ.${data.deliveryProvince}` : '',
    data.deliveryPostalCode || '',
  ]);

  const items = Array.isArray(order.items) ? order.items : [];
  const subtotal = Number(order.subtotal ?? items.reduce((sum, item) => sum + Number(item.amount || 0), 0));
  const vatRate = Number(order.vatRate ?? 7);
  const vatAmount = Number(order.vatAmount ?? (subtotal * vatRate) / 100);
  const totalAmount = Number(order.totalAmount ?? subtotal + vatAmount);

  const sig = signatures || {};
  const sellerSig = sig.sellerSignatureUrl
    ? `<img src="${sig.sellerSignatureUrl}" style="max-height:40px;max-width:120px;" />`
    : '';
  const approverSig = sig.approverSignatureUrl
    ? `<img src="${sig.approverSignatureUrl}" style="max-height:40px;max-width:120px;" />`
    : '';

  const rows = items
    .map((item, index) => {
      const unitPrice = Number(item.unitPrice ?? (item as any).price ?? 0);
      const discount = Number(item.discount ?? 0);
      const quantity = Number(item.quantity || 0);
      const amount = Number(item.amount ?? (unitPrice - discount) * quantity);
      return `
          <tr>
            <td style="text-align:center">${index + 1}</td>
            <td>${sanitizeString(item.name || item.description)}</td>
            <td class="num">${quantity}</td>
            <td style="text-align:center">${sanitizeString(item.unitLabel)}</td>
            <td class="num">${fmtNumber(unitPrice)}</td>
            <td class="num">${fmtNumber(discount)}</td>
            <td class="num">${fmtNumber(amount)}</td>
          </tr>
        `;
    })
    .join('');

  return `
<!DOCTYPE html>
<html lang="th">
<head>
  <meta charset="UTF-8" />
  <title>ใบสั่งขาย ${data.salesOrderNumber}</title>
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+Thai:wght@400;600&display=swap" rel="stylesheet">
  <style>
    :root{ --primary:#0F4D8B; --border:#E5E7EB; --muted:#666; }
    *{ box-sizing:border-box; }
    body{ font-family:'Noto Sans Thai','Tahoma','DejaVu Sans',sans-serif; font-size:11pt; color:#111; margin:0; }
    @page{ size:A4; margin:16mm; }
    .top{ display:flex; justify-content:space-between; align-items:flex-start; }
    .company{ max-width:60%; }
    .company h1{ margin:0; font-size:14pt; color:var(--primary); }
    .company p{ margin:2px 0; font-size:10.5pt; color:#333; }
    .title{ font-size:28pt; font-weight:600; color:#111; }
    .grid{ display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-top:10px; }
    .box{ border:1px solid var(--border); border-radius:6px; padding:8px; }
    .row{ display:flex; gap:8px; margin:2px 0; font-size:10.5pt; }
    .row .k{ min-width:28%; color:#444; font-weight:600; }
    table{ width:100%; border-collapse:collapse; margin-top:12px; }
    th,td{ border:1px solid var(--border); padding:6px; font-size:10.5pt; }
    th{ background:var(--primary); color:#fff; text-align:center; }
    td.num{ text-align:right; }
    .totals{ margin-top:10px; display:flex; justify-content:flex-end; }
    .totals .line{ display:flex; justify-content:space-between; padding:3px 0; }
    .sig{ display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-top:12px; }
    .sigbox{ border:1px solid var(--border); height:34mm; padding:6px; display:flex; flex-direction:column; justify-content:flex-end; }
    .sigbox .name{ text-align:center; font-weight:600; }
    .sigbox .role{ text-align:center; color:var(--muted); font-size:10pt; }
  </style>
</head>
<body>
  <div class="top">
    <div class="company">
      ${data.logoUrl ? `<img src="${data.logoUrl}" style="height:24px;margin-bottom:4px;" />` : ''}
      <h1>${data.companyName}</h1>
      <p>${data.companyAddress}</p>
      <p>เลขผู้เสียภาษี: ${data.taxId}</p>
      <p>โทร ${data.companyPhone} · ${data.companyEmail}</p>
    </div>
    <div class="title">ใบสั่งขาย</div>
  </div>

  <div class="grid">
    <div class="box">
      <div class="row"><div class="k">เลขที่</div><div>${data.salesOrderNumber || '-'}</div></div>
      <div class="row"><div class="k">วันที่</div><div>${formatDate(order.orderDate)}</div></div>
      <div class="row"><div class="k">เงื่อนไขชำระ</div><div>${data.paymentTerms || '-'}</div></div>
    </div>
    <div class="box">
      <div class="row"><div class="k">ลูกค้า</div><div>${data.customerName || '-'}</div></div>
      <div class="row"><div class="k">โทร</div><div>${data.customerPhone || '-'}</div></div>
      <div class="row"><div class="k">ที่อยู่จัดส่ง</div><div>${shippingAddress || '-'}</div></div>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th style="width:6%">ลำดับ</th>
        <th>รายการ</th>
        <th style="width:10%">จำนวน</th>
        <th style="width:12%">หน่วย</th>
        <th style="width:14%">ราคา/หน่วย</th>
        <th style="width:14%">ส่วนลด</th>
        <th style="width:16%">รวม</th>
      </tr>
    </thead>
    <tbody>
      ${rows}
    </tbody>
  </table>

  <div class="totals">
    <div style="width:260px">
      <div class="line"><span>รวม</span><span>${fmtNumber(subtotal)}</span></div>
      <div class="line"><span>VAT ${vatRate}%</span><span>${fmtNumber(vatAmount)}</span></div>
      <div class="line" style="font-weight:600;border-top:1px solid var(--border);padding-top:6px">
        <span>ยอดรวม</span><span>${fmtNumber(totalAmount)}</span>
      </div>
    </div>
  </div>

  ${data.notes ? `<div style="margin-top:8px;font-size:10.5pt"><strong>หมายเหตุ:</strong> ${data.notes}</div>` : ''}

  <div class="sig">
    <div class="sigbox">
      <div style="height:40px;display:flex;align-items:flex-end;justify-content:center;">${sellerSig}</div>
      <div class="name">${sig.sellerName || '-'}</div>
      <div class="role">${sig.sellerPosition || 'พนักงานขาย'}</div>
    </div>
    <div class="sigbox">
      <div style="height:40px;display:flex;align-items:flex-end;justify-content:center;">${approverSig}</div>
      <div class="name">${sig.approverName || '-'}</div>
      <div class="role">${sig.approverPosition || 'ผู้อนุมัติ'}</div>
    </div>
  </div>
</body>
</html>
  `;
}
