import { NextRequest, NextResponse } from 'next/server';
import { Client, validateSignature } from '@line/bot-sdk';
import connectDB from '@/lib/mongodb';
import Customer from '@/models/Customer';
import LineGroupLink from '@/models/LineGroupLink';
import LineCommand from '@/models/LineCommand';
import LineUser from '@/models/LineUser';
import Product from '@/models/Product';
import { ensureDefaultLineCommands } from '@/services/lineBotConfig';
import { compileLineCommandPattern } from '@/utils/lineCommand';
import { createQuotation, QuotationServiceError } from '@/services/quotationService';
import { round2, computeLineTotal } from '@/utils/number';
function escapeRegex(str: string) { return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }
function normalizeOptionRecord(options: any): Record<string, string> | undefined {
  if (!options || typeof options !== 'object') return undefined;
  const entries = options instanceof Map ? Array.from(options.entries()) : Object.entries(options);
  const normalized = entries.reduce<Record<string, string>>((acc, [key, value]) => {
    const normalizedKey = String(key || '').trim();
    const normalizedValue = String(value ?? '').trim();
    if (normalizedKey && normalizedValue) {
      acc[normalizedKey] = normalizedValue;
    }
    return acc;
  }, {});
  return Object.keys(normalized).length ? normalized : undefined;
}

async function fetchLineProfile(
  client: Client,
  sourceType: string | undefined,
  userId: string,
  groupId?: string,
  roomId?: string
) {
  if (sourceType === 'group' && groupId) {
    return client.getGroupMemberProfile(groupId, userId);
  }
  if (sourceType === 'room' && roomId) {
    return client.getRoomMemberProfile(roomId, userId);
  }
  if (sourceType === 'user') {
    return client.getProfile(userId);
  }
  return null;
}

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

    await connectDB();
    await ensureDefaultLineCommands();
    const commands = await LineCommand.find({ isActive: true }).sort({ priority: 1 }).lean();

    const client = getLineClient();

    await Promise.all(
      events.map(async (event: any) => {
        try {
          const sourceType: string | undefined = event.source?.type;
          const userId: string | undefined = event.source?.userId;
          const groupId: string | undefined =
            sourceType === 'group' ? event.source.groupId : undefined;
          const roomId: string | undefined =
            sourceType === 'room' ? event.source.roomId : undefined;

          let lineUser = null;
          if (userId) {
            const existing = await LineUser.findOne({ lineUserId: userId }).lean();
            let displayName = existing?.displayName;
            let pictureUrl = existing?.pictureUrl;

            if (!displayName || !pictureUrl) {
              try {
                const profile = await fetchLineProfile(client, sourceType, userId, groupId, roomId);
                displayName = profile?.displayName || displayName;
                pictureUrl = profile?.pictureUrl || pictureUrl;
              } catch (error) {
                console.warn('[LINE Webhook] Failed to fetch LINE profile:', error);
              }
            }

            const updates: any = { lastSeenAt: new Date() };
            if (displayName) updates.displayName = displayName;
            if (pictureUrl) updates.pictureUrl = pictureUrl;

            lineUser = await LineUser.findOneAndUpdate(
              { lineUserId: userId },
              { $set: updates, $setOnInsert: { canIssueQuotation: false, isActive: true } },
              { upsert: true, new: true }
            );
          }

          if (event.type !== 'message') return;
          if (!event.message) return;
          if (event.message.type !== 'text') return;

          const text: string = (event.message.text || '').trim();
          if (!text) return;

          const lines = text.split(/\r?\n/);
          const firstLine = lines[0]?.trim() || '';

          const matchResult = (() => {
            for (const command of commands) {
              try {
                const regex = compileLineCommandPattern(command.pattern);
                const target = command.key === 'quotation' ? firstLine : text;
                const match = target.match(regex);
                if (match) {
                  return { command, match };
                }
              } catch (error) {
                console.warn('[LINE Webhook] Invalid command pattern:', command.pattern, error);
              }
            }
            return null;
          })();

          if (!matchResult) return;

          const { command, match } = matchResult;

          if (command.key === 'greeting') {
            await client.replyMessage(event.replyToken, { type: 'text', text: 'สวัสดี' });
            return;
          }

          if (command.key === 'link_customer') {
            if (sourceType !== 'group' || !groupId) {
              await client.replyMessage(event.replyToken, { type: 'text', text: 'คำสั่งนี้ใช้ได้เฉพาะในกลุ่ม LINE เท่านั้น' });
              return;
            }
            const code = (match?.[1] || '').toUpperCase().trim();
            if (!code) {
              await client.replyMessage(event.replyToken, { type: 'text', text: 'รูปแบบคำสั่งไม่ถูกต้อง' });
              return;
            }

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

          if (command.key === 'quotation') {
            if (sourceType !== 'group' || !groupId) {
              await client.replyMessage(event.replyToken, { type: 'text', text: 'คำสั่งนี้ใช้ได้เฉพาะในกลุ่มที่ผูกลูกค้าแล้ว' });
              return;
            }
            if (!userId || !lineUser || !lineUser.isActive || !lineUser.canIssueQuotation) {
              await client.replyMessage(event.replyToken, { type: 'text', text: 'ไม่มีสิทธิ์ออกใบเสนอราคา กรุณาติดต่อผู้ดูแลระบบ' });
              return;
            }

            const subject = (match?.[1] || '').trim();
            if (!subject) {
              await client.replyMessage(event.replyToken, { type: 'text', text: 'กรุณาระบุหัวข้อใบเสนอราคา' });
              return;
            }

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

            // หา product จาก SKU (รองรับทั้ง Product.sku และ units.sku)
            const items: any[] = [];
            for (const il of itemLines) {
              // รองรับทั้งมี/ไม่มีเครื่องหมาย # นำหน้า SKU
              const m = il.match(/^#?([A-Za-z0-9_-]+)\s+(\d+(?:\.\d+)?)$/);
              if (!m) continue;
              const sku = m[1];
              const qty = Number(m[2]);
              // หา SKU แบบไม่สนตัวพิมพ์เล็ก/ใหญ่
              const skuRegex = new RegExp(`^${escapeRegex(sku)}$`, 'i');
              const product = await Product.findOne({
                $or: [
                  { sku: { $regex: skuRegex } },
                  { 'units.sku': { $regex: skuRegex } },
                  { 'skuVariants.sku': { $regex: skuRegex } },
                ],
                isDeleted: { $ne: true }
              });
              if (!product) continue;
              const p: any = product;
              const normalizedSku = String(sku || '').toLowerCase();
              const matchedBaseSku =
                String(p.sku || '').toLowerCase() === normalizedSku;
              const matchedUnit = Array.isArray(p.units)
                ? p.units.find((unit: any) =>
                    String(unit?.sku || '').toLowerCase() === normalizedSku
                  )
                : undefined;
              const matchedVariant = Array.isArray(p.skuVariants)
                ? p.skuVariants.find((variant: any) =>
                    String(variant?.sku || '').toLowerCase() === normalizedSku &&
                    variant?.isActive !== false
                  )
                : undefined;
              const hasMatch = Boolean(matchedBaseSku || matchedUnit || matchedVariant);
              if (!hasMatch) continue;
              const variantOptions = normalizeOptionRecord(matchedVariant?.options);
              const variantUnit = matchedVariant?.unitLabel
                ? p.units?.find((unit: any) =>
                    String(unit?.label || '').toLowerCase() === String(matchedVariant?.unitLabel || '').toLowerCase()
                  )
                : undefined;
              const unitLabel =
                matchedVariant?.unitLabel || matchedUnit?.label || p.units?.[0]?.label || p.unit || '';
              const unitPrice =
                (variantUnit?.price ?? matchedUnit?.price ?? p.units?.[0]?.price ?? p.price ?? 0) as number;
              items.push({
                productId: String(p._id),
                productName: p.name,
                description: '',
                quantity: qty,
                unit: unitLabel,
                unitPrice,
                discount: 0,
                sku: matchedVariant?.sku || matchedUnit?.sku || p.sku || undefined,
                selectedOptions: variantOptions,
                totalPrice: round2(computeLineTotal(qty, unitPrice, 0)),
              });
            }

            if (items.length === 0) {
              await client.replyMessage(event.replyToken, { type: 'text', text: 'ไม่พบสินค้าที่ตรงกับรายการที่ส่งมา' });
              return;
            }

            const subtotal = round2(items.reduce((s, it) => s + (it.totalPrice || 0), 0));
            const totalDiscount = 0;
            const totalAmount = round2(subtotal - totalDiscount);
            const vatRate = 7;

            let quotation;
            try {
              quotation = await createQuotation(
                {
                  customerId: String(link.customerId),
                  customerName: customer.name,
                  customerPhone: customer.phoneNumber,
                  subject,
                  paymentTerms: 'ชำระเงินทันที',
                  deliveryTerms: '',
                  items,
                  subtotal,
                  totalDiscount,
                  totalAmount,
                  vatRate,
                  status: 'draft',
                },
                {
                  source: 'line',
                  lineUser: {
                    lineUserId: lineUser.lineUserId,
                    displayName: lineUser.displayName,
                  },
                }
              );
            } catch (error) {
              if (error instanceof QuotationServiceError) {
                await client.replyMessage(event.replyToken, { type: 'text', text: `ออกใบเสนอราคาไม่สำเร็จ: ${error.message}` });
                return;
              }
              throw error;
            }

            // สร้างลิงก์ดาวน์โหลด PDF และส่งกลับ
            const configuredBase = (process.env.NEXT_PUBLIC_APP_URL || '').replace(/\/$/, '');
            const origin = new URL(request.url).origin;
            const baseUrl = configuredBase || origin;
            const viewUrl = `${baseUrl}/quotation/${quotation._id}`;
            await client.replyMessage(event.replyToken, { type: 'text', text: `ดูใบเสนอราคา: ${viewUrl}` });
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
