import connectDB from '@/lib/mongodb';
import Quotation from '@/models/Quotation';
import { Settings } from '@/models/Settings';
import Approval from '@/models/Approval';
import Customer from '@/models/Customer';
import { createQuotationSchema } from '@/schemas/quotation';
import { checkDiscountGuardrails } from '@/utils/pricing';
import { round2, computeVatIncluded, computeLineTotal } from '@/utils/number';

export class QuotationServiceError extends Error {
  status: number;
  details?: any;

  constructor(message: string, status = 400, details?: any) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

export interface QuotationCreatorContext {
  adminId?: string;
  role?: string;
}

export interface CreateQuotationOptions {
  actor?: QuotationCreatorContext;
  source?: 'api' | 'line';
  lineUser?: {
    lineUserId: string;
    displayName?: string;
  };
}

export async function createQuotation(
  raw: any,
  options: CreateQuotationOptions = {}
) {
  const parsed = createQuotationSchema.safeParse(raw);
  if (!parsed.success) {
    throw new QuotationServiceError(
      'รูปแบบข้อมูลไม่ถูกต้อง',
      400,
      parsed.error.issues
    );
  }

  const quotationData = parsed.data as any;
  await connectDB();

  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const startOfMonth = new Date(year, today.getMonth(), 1);
  const endOfMonth = new Date(year, today.getMonth() + 1, 0);
  const count = await Quotation.countDocuments({
    createdAt: { $gte: startOfMonth, $lte: endOfMonth }
  });
  const quotationNumber = `QT${year}${month}${String(count + 1).padStart(3, '0')}`;

  const guard = await checkDiscountGuardrails(
    (quotationData.items || []).map((item: any) => ({
      productId: item.productId,
      quantity: Number(item.quantity),
      unitPrice: Number(item.unitPrice),
      discount: Number(item.discount || 0),
    })),
    {
      role: options.actor?.role,
      customerGroup: undefined,
    }
  );

  if (!guard.ok) {
    throw new QuotationServiceError(
      'ส่วนลดบางรายการไม่เป็นไปตามนโยบาย',
      400,
      { violations: guard.violations, requiresApproval: guard.requiresApproval }
    );
  }

  let customerCode = '';
  try {
    const customer = await Customer.findById(quotationData.customerId).lean();
    customerCode = (customer as any)?.customerCode || '';
  } catch (error) {
    console.warn('[Quotation Service] Failed to fetch customer code:', error);
  }

  const normalizedItems = quotationData.items.map((item: any) => {
    const quantity = Number(item.quantity);
    const unitPrice = Number(item.unitPrice);
    const discount = Number(item.discount || 0);
    const totalPrice = Number.isFinite(Number(item.totalPrice))
      ? Number(item.totalPrice)
      : round2(computeLineTotal(quantity, unitPrice, discount));

    return {
      ...item,
      quantity,
      unitPrice,
      discount,
      totalPrice,
      selectedOptions: (() => {
        if (!item.selectedOptions || typeof item.selectedOptions !== 'object') return undefined;
        const entries = Object.entries(item.selectedOptions).filter(([, value]) =>
          typeof value === 'string' && value.trim() !== ''
        );
        if (!entries.length) return undefined;
        return Object.fromEntries(entries.map(([key, value]) => [String(key).trim(), String(value).trim()]));
      })(),
    };
  });

  const computedSubtotal = round2(
    normalizedItems.reduce((sum: number, item: any) => sum + Number(item.totalPrice || 0), 0)
  );
  const subtotal = Number.isFinite(Number(quotationData.subtotal))
    ? round2(Number(quotationData.subtotal))
    : computedSubtotal;
  const specialDiscount = round2(Number(quotationData.specialDiscount || 0));
  const totalDiscount = Number.isFinite(Number(quotationData.totalDiscount))
    ? round2(Number(quotationData.totalDiscount))
    : specialDiscount;
  const totalAmount = Number.isFinite(Number(quotationData.totalAmount))
    ? round2(Number(quotationData.totalAmount))
    : round2(subtotal - totalDiscount);
  const vatRate = Number(quotationData.vatRate ?? 7);
  const { vatAmount } = computeVatIncluded(totalAmount, vatRate);

  const modelData: any = {
    ...quotationData,
    quotationNumber,
    customerCode,
    validUntil: quotationData.validUntil && quotationData.validUntil !== ''
      ? new Date(quotationData.validUntil)
      : new Date(new Date().getTime() + 7 * 24 * 60 * 60 * 1000),
    items: normalizedItems,
    vatRate,
    subtotal,
    totalDiscount,
    totalAmount,
    vatAmount: round2(vatAmount),
    grandTotal: round2(totalAmount),
  };

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

  if (!modelData.deliveryZipcode) {
    delete modelData.deliveryZipcode;
  }

  if (options.actor?.adminId) {
    if (String(options.actor.role || '').toLowerCase() === 'seller') {
      modelData.assignedTo = options.actor.adminId;
    } else if (!modelData.assignedTo) {
      modelData.assignedTo = options.actor.adminId;
    }
    modelData._creatorRole = options.actor.role;
  }

  if (options.source === 'line') {
    const lineLabel = options.lineUser?.displayName
      ? `${options.lineUser.displayName} (${options.lineUser.lineUserId})`
      : options.lineUser?.lineUserId || 'LINE';
    modelData.notes = modelData.notes
      ? `${modelData.notes}\nสร้างจาก LINE โดย ${lineLabel}`
      : `สร้างจาก LINE โดย ${lineLabel}`;
  }

  let requireApproval = false;
  try {
    const settings = (await Settings.findOne({}).lean()) as any;
    const maxDiscount = settings?.salesPolicy?.maxDiscountPercentWithoutApproval ?? 10;
    const hasOverDiscount = modelData.items.some((item: any) => Number(item.discount || 0) > maxDiscount);
    if (hasOverDiscount) requireApproval = true;

    const tiers: Array<{ minTotal: number; discountPercent: number }> =
      settings?.salesPolicy?.tieredDiscounts || [];
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

  try {
    const last = await Quotation.findOne({ customerId: modelData.customerId })
      .sort({ createdAt: -1 })
      .lean();
    if (last && Array.isArray((last as any).items)) {
      const a = (last as any).items
        .map((item: any) => ({
          p: String(item.productId),
          u: String(item.unit || ''),
          up: Number(item.unitPrice),
          d: Number(item.discount),
        }))
        .sort((x: any, y: any) => (x.p + x.u).localeCompare(y.p + y.u));
      const b = (modelData.items as any[])
        .map((item: any) => ({
          p: String(item.productId),
          u: String(item.unit || ''),
          up: Number(item.unitPrice),
          d: Number(item.discount),
        }))
        .sort((x: any, y: any) => (x.p + x.u).localeCompare(y.p + y.u));
      const identical = a.length === b.length && a.every((ai: any, idx: number) => {
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

  if (requireApproval) {
    try {
      await Approval.create({
        targetType: 'quotation',
        targetId: String(quotation._id),
        requestedBy: modelData.assignedTo || 'system',
        reason: modelData.approvalReason,
        team: undefined,
      });
    } catch (error) {
      console.error('[Quotation Service] Create approval entry failed', error);
    }
  }

  return quotation;
}
