import { NextRequest, NextResponse } from 'next/server';
import { Client, validateSignature } from '@line/bot-sdk';
import connectDB from '@/lib/mongodb';
import Customer from '@/models/Customer';
import LineGroupLink from '@/models/LineGroupLink';
import Quotation from '@/models/Quotation';
import { generatePDFFromHTML, generateQuotationHTML } from '@/utils/pdfUtils';
import Product from '@/models/Product';
function escapeRegex(str: string) { return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }
import { round2, computeVatIncluded, computeLineTotal } from '@/utils/number';

export const dynamic = 'force-dynamic';

function getLineClient(): Client {
  const channelAccessToken = process.env.LINE_CHANNEL_ACCESS_TOKEN;
  if (!channelAccessToken) {
    throw new Error('LINE_CHANNEL_ACCESS_TOKEN is not set');
  }
  return new Client({ channelAccessToken });
}

export async function POST(request: NextRequest) {
  try {
    const channelSecret = process.env.LINE_CHANNEL_SECRET;
    if (!channelSecret) {
      return NextResponse.json({ error: 'LINE channel secret not configured' }, { status: 500 });
    }

    const signature = request.headers.get('x-line-signature') || '';
    const bodyText = await request.text();

    // Validate signature
    const isValid = validateSignature(bodyText, channelSecret, signature);
    if (!isValid) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const body = JSON.parse(bodyText);
    const events: any[] = body.events || [];

    const client = getLineClient();

    await Promise.all(
      events.map(async (event: any) => {
        try {
          if (event.type !== 'message') return;
          if (!event.message || event.message.type !== 'text') return;

          // เฉพาะในกลุ่มเท่านั้น
          if (event.source?.type !== 'group') return;

          const groupId: string = event.source.groupId;
          const text: string = (event.message.text || '').trim();

          // เคสง่าย: "สวัสดี"
          if (text === 'สวัสดี' || text === 'สวัสดีครับ' || text === 'สวัสดีค่ะ') {
            await client.replyMessage(event.replyToken, { type: 'text', text: 'สวัสดี' });
            return;
          }

          await connectDB();

          // คำสั่งผูกกลุ่มกับลูกค้า: ลูกค้า#CYYMMXXXX
          if (/^ลูกค้า#(C\d{8}|[A-Z]\d[A-Z]\d)$/i.test(text)) {
            const code = text.split('#')[1].toUpperCase();
            const customer = await Customer.findOne({ customerCode: code });
            if (!customer) {
              await client.replyMessage(event.replyToken, { type: 'text', text: `ไม่พบลูกค้ารหัส ${code}` });
              return;
            }
            await LineGroupLink.findOneAndUpdate(
              { groupId },
              { groupId, customerId: String((customer as any)._id) },
              { upsert: true }
            );
            await client.replyMessage(event.replyToken, { type: 'text', text: `ผูกกลุ่มกับลูกค้า ${customer.name} (${code}) แล้ว` });
            return;
          }

          // คำสั่งออกใบเสนอราคา: บรรทัดแรกขึ้นต้น QT/qt/Qt ตามด้วยชื่อหัวข้อ
          // ตัวอย่าง:
          // QT NAME\n#AAAA 10\n#BBBB 20
          if (/^(QT|qt|Qt)\s+/.test(text)) {
            const lines = text.split(/\r?\n/);
            const first = lines[0];
            const subject = first.replace(/^(QT|qt|Qt)\s+/, '').trim();

            // ตรวจสอบการผูกลูกค้า
            const link = await LineGroupLink.findOne({ groupId });
            if (!link) {
              await client.replyMessage(event.replyToken, { type: 'text', text: 'ยังไม่ผูกกลุ่มกับลูกค้า ใช้คำสั่ง: ลูกค้า#C26010001' });
              return;
            }

            // แปลงรายการสินค้า
            const itemLines = lines.slice(1).map(l => l.trim()).filter(Boolean);
            if (itemLines.length === 0) {
              await client.replyMessage(event.replyToken, { type: 'text', text: 'กรุณาระบุรายการสินค้าเช่น\n#AAAA 10' });
              return;
            }

            // ดึง customer
            const customerDoc = await Customer.findById((link as any).customerId);
            const customer: any = customerDoc as any;
            if (!customerDoc) {
              await client.replyMessage(event.replyToken, { type: 'text', text: 'ไม่พบบัญชึกลูกค้าที่ผูกไว้' });
              return;
            }

            // หา product จาก sku ตรงๆ (อิงจาก Product.sku)
            const items: any[] = [];
            for (const il of itemLines) {
              // รองรับทั้งมี/ไม่มีเครื่องหมาย # นำหน้า SKU
              const m = il.match(/^#?([A-Za-z0-9_-]+)\s+(\d+(?:\.\d+)?)$/);
              if (!m) continue;
              const sku = m[1];
              const qty = Number(m[2]);
              // หา SKU แบบไม่สนตัวพิมพ์เล็ก/ใหญ่
              const product = await Product.findOne({
                sku: { $regex: new RegExp(`^${escapeRegex(sku)}$`, 'i') },
                isDeleted: { $ne: true }
              });
              if (!product) continue;
              const p: any = product;
              const unitLabel = p.units?.[0]?.label || '';
              const unitPrice = (p.units?.[0]?.price ?? p.price ?? 0) as number;
              items.push({
                productId: String(p._id),
                productName: p.name,
                description: '',
                quantity: qty,
                unit: unitLabel,
                unitPrice,
                discount: 0,
                totalPrice: round2(computeLineTotal(qty, unitPrice, 0)),
              });
            }

            if (items.length === 0) {
              await client.replyMessage(event.replyToken, { type: 'text', text: 'ไม่พบสินค้าที่ตรงกับรายการที่ส่งมา' });
              return;
            }

            // คำนวณยอดรวมตามตรรกะ VAT รวมภาษี
            const subtotal = round2(items.reduce((s, it) => s + (it.quantity * it.unitPrice), 0));
            const totalDiscount = 0;
            const totalAmount = round2(subtotal - totalDiscount);
            const vatRate = 7;
            const { vatAmount } = computeVatIncluded(totalAmount, vatRate);
            const grandTotal = totalAmount;

            // สร้างใบเสนอราคาในฐานข้อมูล
            const now = new Date();
            const validUntil = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
            const today = new Date();
            const year = today.getFullYear();
            const month = String(today.getMonth() + 1).padStart(2, '0');
            const startOfMonth = new Date(year, today.getMonth(), 1);
            const endOfMonth = new Date(year, today.getMonth() + 1, 0);
            const count = await Quotation.countDocuments({ createdAt: { $gte: startOfMonth, $lte: endOfMonth } });
            const quotationNumber = `QT${year}${month}${String(count + 1).padStart(3, '0')}`;

            const quotation = await Quotation.create({
              quotationNumber,
              customerId: String(link.customerId),
              customerName: customer.name,
              subject,
              validUntil,
              paymentTerms: 'ชำระเงินทันที',
              deliveryTerms: '',
              items,
              subtotal,
              totalDiscount,
              totalAmount,
              vatRate,
              vatAmount,
              grandTotal,
              status: 'draft',
            } as any);

            // สร้างลิงก์ดาวน์โหลด PDF และส่งกลับ
            const configuredBase = (process.env.NEXT_PUBLIC_APP_URL || '').replace(/\/$/, '');
            const origin = new URL(request.url).origin;
            const baseUrl = configuredBase || origin;
            const downloadUrl = `${baseUrl}/api/quotations/${quotation._id}/pdf`;
            await client.replyMessage(event.replyToken, { type: 'text', text: `ดาวน์โหลดใบเสนอราคา: ${downloadUrl}` });
            return;
          }
        } catch (err) {
          console.error('[LINE Webhook] Error handling event:', err);
        }
      })
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[LINE Webhook] Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
