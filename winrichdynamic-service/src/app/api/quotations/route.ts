import { NextResponse } from 'next/server';
import * as jose from 'jose';
import { cookies } from 'next/headers';
import connectDB from '@/lib/mongodb';
import Quotation from '@/models/Quotation';
import { Settings } from '@/models/Settings';
import Approval from '@/models/Approval';
import { createQuotationSchema, searchQuotationSchema } from '@/schemas/quotation';
import { checkDiscountGuardrails } from '@/utils/pricing';
import { round2, computeVatIncluded } from '@/utils/number';

// GET: ดึงใบเสนอราคาทั้งหมด (พร้อมการค้นหาและ pagination)
export async function GET(request: Request) {
  try {
    await connectDB();
    
    const url = new URL(request.url);
    const searchParams = url.searchParams;
    const page = Number(searchParams.get('page') || '1');
    const limit = Math.min(Number(searchParams.get('limit') || '20'), 100);
    const q = searchParams.get('q') || '';
    const customerId = searchParams.get('customerId');
    const status = searchParams.get('status');
    const assignedTo = searchParams.get('assignedTo');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');

    // สร้าง filter object
    const filter: Record<string, any> = {};
    
    if (q) {
      filter.$or = [
        { quotationNumber: { $regex: q, $options: 'i' } },
        { subject: { $regex: q, $options: 'i' } },
        { customerName: { $regex: q, $options: 'i' } },
      ];
    }
    
    if (customerId) {
      filter.customerId = customerId;
    }
    
    if (status) {
      filter.status = status;
    }
    
    if (assignedTo) {
      filter.assignedTo = { $regex: assignedTo, $options: 'i' };
    }
    
    if (dateFrom || dateTo) {
      filter.createdAt = {};
      if (dateFrom) {
        filter.createdAt.$gte = new Date(dateFrom);
      }
      if (dateTo) {
        filter.createdAt.$lte = new Date(dateTo);
      }
    }

    // RBAC: จำกัดข้อมูลสำหรับ Seller
    try {
      const authHeader = (request.headers as any).get?.('authorization') as string | null;
      const bearer = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : undefined;
      const cookieToken = (await cookies()).get('b2b_token')?.value;
      const token = bearer || cookieToken;
      if (token) {
        const payload: any = jose.decodeJwt(token);
        const roleName = String(payload.role || '').toLowerCase();
        if (roleName === 'seller') {
          filter.assignedTo = payload.adminId;
        }
      }
    } catch {}

    // นับจำนวนทั้งหมด
    const total = await Quotation.countDocuments(filter);
    
    // ดึงข้อมูลใบเสนอราคา
    const quotations = await Quotation.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    // ถ้าไม่ได้ส่ง query parameters ให้คงรูปแบบ array เดิม
    const hasSearchParams = searchParams.has('page') || searchParams.has('limit') || searchParams.has('q') || 
                           searchParams.has('customerId') || searchParams.has('status') || searchParams.has('assignedTo') ||
                           searchParams.has('dateFrom') || searchParams.has('dateTo');
    
    if (!hasSearchParams) {
      return NextResponse.json(quotations);
    }

    return NextResponse.json({
      data: quotations,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
    
  } catch (error) {
    console.error('[Quotation API] GET Error:', error);
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการดึงข้อมูลใบเสนอราคา' },
      { status: 500 }
    );
  }
}

// POST: สร้างใบเสนอราคาใหม่
export async function POST(request: Request) {
  try {
    const raw = await request.json();
    console.log('[Quotation API] Received data:', JSON.stringify(raw, null, 2));
    
    // Validate input data
    const parsed = createQuotationSchema.safeParse(raw);
    if (!parsed.success) {
      console.error('[Quotation API] Validation failed:', {
        raw,
        errors: parsed.error.issues
      });
      return NextResponse.json(
        { 
          error: 'รูปแบบข้อมูลไม่ถูกต้อง', 
          details: parsed.error.issues
        },
        { status: 400 }
      );
    }

    const quotationData = parsed.data as any;
    
    await connectDB();
    
    // สร้างเลขที่ใบเสนอราคาอัตโนมัติ
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    
    // นับจำนวนใบเสนอราคาในเดือนนี้
    const startOfMonth = new Date(year, today.getMonth(), 1);
    const endOfMonth = new Date(year, today.getMonth() + 1, 0);
    
    const count = await Quotation.countDocuments({
      createdAt: { $gte: startOfMonth, $lte: endOfMonth }
    });
    
    const quotationNumber = `QT${year}${month}${String(count + 1).padStart(3, '0')}`;
    
    // ตรวจสอบ guardrails ส่วนลดก่อนสร้าง
    const guard = await checkDiscountGuardrails(
      (quotationData.items || []).map((i: any) => ({
        productId: i.productId,
        quantity: Number(i.quantity),
        unitPrice: Number(i.unitPrice),
        discount: Number(i.discount || 0),
      })),
      {
        role: undefined,
        customerGroup: undefined,
      }
    );

    if (!guard.ok) {
      return NextResponse.json(
        { error: 'ส่วนลดบางรายการไม่เป็นไปตามนโยบาย', violations: guard.violations, requiresApproval: guard.requiresApproval },
        { status: 400 }
      );
    }

    // ดึงข้อมูลลูกค้าเพื่อเอารหัสลูกค้า
    let customerCode = '';
    try {
      const Customer = (await import('@/models/Customer')).default;
      const customer = await Customer.findById(quotationData.customerId).lean();
      customerCode = (customer as any)?.customerCode || '';
    } catch (error) {
      console.warn('[Quotation API] Failed to fetch customer code:', error);
    }

    // แปลงข้อมูลให้ตรงกับ Model
    const modelData: any = {
      ...quotationData,
      quotationNumber,
      customerCode, // เพิ่มรหัสลูกค้า
      // หากไม่ได้ส่งวันหมดอายุมา ให้ตั้งค่า +7 วันจากวันนี้
      validUntil: quotationData.validUntil && quotationData.validUntil !== ''
        ? new Date(quotationData.validUntil)
        : new Date(new Date().getTime() + 7 * 24 * 60 * 60 * 1000),
      // แปลงข้อมูลตัวเลขให้เป็น number
      items: quotationData.items.map((item: any) => ({
        ...item,
        quantity: Number(item.quantity),
        unitPrice: Number(item.unitPrice),
        discount: Number(item.discount),
        totalPrice: Number(item.totalPrice),
        selectedOptions: (() => {
          if (!item.selectedOptions || typeof item.selectedOptions !== 'object') return undefined;
          const entries = Object.entries(item.selectedOptions).filter(([, value]) =>
            typeof value === 'string' && value.trim() !== ''
          );
          if (!entries.length) return undefined;
          return Object.fromEntries(entries.map(([key, value]) => [String(key).trim(), String(value).trim()]));
        })(),
      })),
      vatRate: Number(quotationData.vatRate),
      subtotal: round2(Number(quotationData.subtotal || 0)),
      totalDiscount: round2(Number(quotationData.totalDiscount || 0)),
      totalAmount: round2(Number(quotationData.totalAmount || 0)),
      // คำนวณ VAT แบบรวมภาษีแบบเสถียร
      ...(() => {
        const total = Number(quotationData.totalAmount || 0);
        const rate = Number(quotationData.vatRate || 7);
      const { vatAmount } = computeVatIncluded(total, rate);
      return { vatAmount: round2(vatAmount), grandTotal: round2(total) };
    })(),
  } as any;

    if (Array.isArray(quotationData.deliveryBatches) && quotationData.deliveryBatches.length > 0) {
      modelData.deliveryBatches = quotationData.deliveryBatches.map((batch: any, index: number) => ({
        batchId: (batch.batchId && String(batch.batchId).trim()) || `BATCH-${index + 1}`,
        deliveredQuantity: Number(batch.deliveredQuantity || 0),
        deliveryDate: new Date(batch.deliveryDate),
        deliveryStatus: batch.deliveryStatus || 'pending',
        trackingNumber: batch.trackingNumber ? String(batch.trackingNumber).trim() : undefined,
        notes: batch.notes ? String(batch.notes).trim() : undefined,
        deliveredBy: batch.deliveredBy ? String(batch.deliveredBy).trim() : undefined,
        createdAt: batch.createdAt ? new Date(batch.createdAt) : new Date(),
      }));

      const totalItemQuantity = modelData.items.reduce(
        (sum: number, item: any) => sum + Number(item.quantity || 0),
        0
      );

      modelData.totalDeliveredQuantity = 0;
      modelData.remainingQuantity = totalItemQuantity;
      modelData.deliveryStatus = 'not_started';
      modelData.deliveryStartDate = modelData.deliveryBatches.length
        ? new Date(modelData.deliveryBatches[0].deliveryDate)
        : undefined;
    }

    if (modelData.shipToSameAsCustomer) {
      modelData.shippingAddress = modelData.customerAddress;
    }
    
    // ใส่ผู้รับผิดชอบจาก token (ถ้ามี) เพื่อทำ data ownership และ context guardrails
    try {
      const authHeader = (request.headers as any).get?.('authorization') as string | null;
      const bearer = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : undefined;
      const cookieToken = (await cookies()).get('b2b_token')?.value;
      const token = bearer || cookieToken;
      if (token) {
        const payload: any = jose.decodeJwt(token);
        if (payload?.adminId) {
          modelData.assignedTo = payload.adminId; // เก็บ owner เป็น adminId
        }
        // เติม role สำหรับการตรวจ guardrails รอบหน้า (เช่น update)
        modelData._creatorRole = payload?.role;
      }
    } catch {}
    
    // สร้างใบเสนอราคาใหม่
    // Guardrails: ตรวจสอบส่วนลด/threshold จาก Settings + ขั้นบันไดส่วนลดตามยอดรวม
    let requireApproval = false;
    try {
      const settings = (await Settings.findOne({}).lean()) as any;
      const maxDiscount = settings?.salesPolicy?.maxDiscountPercentWithoutApproval ?? 10;
      const hasOverDiscount = modelData.items.some((it: any) => Number(it.discount || 0) > maxDiscount);
      if (hasOverDiscount) requireApproval = true;

      // ขั้นบันไดส่วนลดตามยอดสั่งซื้อรวม (คำนวณเป็นส่วนลดพิเศษแบบจำนวนเงิน)
      const tiers: Array<{ minTotal: number; discountPercent: number }> = settings?.salesPolicy?.tieredDiscounts || [];
      if (Array.isArray(tiers) && tiers.length) {
        const sorted = [...tiers].sort((a, b) => b.minTotal - a.minTotal);
        const tier = sorted.find(t => modelData.subtotal >= Number(t.minTotal || 0));
        if (tier && typeof tier.discountPercent === 'number') {
          const tierDiscountAmt = round2((modelData.subtotal || 0) * (tier.discountPercent / 100));
          const currentSpecial = Number(modelData.specialDiscount || 0);
          if (tierDiscountAmt > currentSpecial) {
            modelData.specialDiscount = tierDiscountAmt;
          }
        }
      }
    } catch {}

    // Re-approval policy: หากลูกค้าเดิมและรายละเอียดสินค้า/ราคา/หน่วย/ส่วนลดเหมือนกับใบล่าสุด ให้ไม่ต้องอนุมัติ
    try {
      const last = await Quotation.findOne({ customerId: modelData.customerId })
        .sort({ createdAt: -1 })
        .lean();
      if (last && Array.isArray((last as any).items)) {
        const a = (last as any).items.map((it: any) => ({ p: String(it.productId), u: String(it.unit || ''), up: Number(it.unitPrice), d: Number(it.discount) }))
          .sort((x: any, y: any) => (x.p + x.u).localeCompare(y.p + y.u));
        const b = (modelData.items as any[]).map((it: any) => ({ p: String(it.productId), u: String(it.unit || ''), up: Number(it.unitPrice), d: Number(it.discount) }))
          .sort((x: any, y: any) => (x.p + x.u).localeCompare(y.p + y.u));
        const sameLength = a.length === b.length;
        const identical = sameLength && a.every((ai: any, idx: number) => {
          const bi = b[idx];
          return ai.p === bi.p && ai.u === bi.u && ai.up === bi.up && ai.d === bi.d;
        });
        if (identical) {
          requireApproval = false;
        }
      }
    } catch {}

    if (requireApproval) {
      modelData.approvalStatus = 'pending';
      modelData.approvalReason = modelData.approvalReason || 'ส่วนลดเกินนโยบาย';
    } else {
      modelData.approvalStatus = modelData.approvalStatus || 'none';
    }

    const quotation = await Quotation.create(modelData);

    // หากต้องขออนุมัติ ให้สร้างเอนทรี Approval ผูกกับ quotation
    if (requireApproval) {
      try {
        await Approval.create({ targetType: 'quotation', targetId: String(quotation._id), requestedBy: modelData.assignedTo || 'system', reason: modelData.approvalReason, team: undefined });
      } catch (e) {
        console.error('[Quotation API] Create approval entry failed', e);
      }
    }
    
    return NextResponse.json(
      quotation.toObject ? quotation.toObject() : quotation,
      { status: 201 }
    );
    
  } catch (error) {
    console.error('[Quotation API] POST Error:', error);
    
    // Log detailed error information
    if (error instanceof Error) {
      console.error('[Quotation API] Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
    }
    
    if (error instanceof Error && error.message.includes('duplicate key')) {
      return NextResponse.json(
        { error: 'เลขที่ใบเสนอราคาซ้ำกับที่มีอยู่ในระบบ' },
        { status: 409 }
      );
    }
    
    // Check for validation errors from Mongoose
    if (error instanceof Error && error.message.includes('validation failed')) {
      return NextResponse.json(
        { 
          error: 'ข้อมูลไม่ถูกต้องตามรูปแบบที่กำหนด',
          details: error.message
        },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการสร้างใบเสนอราคา' },
      { status: 500 }
    );
  }
}
