import PriceBook, { IPriceBook } from '@/models/PriceBook';
import DiscountPolicy, { IDiscountPolicy } from '@/models/DiscountPolicy';
import { Settings, ISettings } from '@/models/Settings';

export interface GuardrailContext {
  role?: string;
  customerGroup?: string;
}

export interface LineInput {
  productId: string;
  category?: string;
  unitLabel?: string;
  quantity: number;
  unitPrice: number;
  discount: number; // percent
}

export interface GuardrailResult {
  ok: boolean;
  requiresApproval: boolean;
  violations: Array<{ code: string; message: string; lineIndex?: number }>; 
}

function isWithinPeriod(now: Date, from?: Date, to?: Date): boolean {
  if (from && now < from) return false;
  if (to && now > to) return false;
  return true;
}

export async function resolveActivePriceBook(customerGroup?: string): Promise<IPriceBook | null> {
  const now = new Date();
  const filter: any = { isActive: true };
  if (customerGroup) filter.customerGroup = customerGroup;
  const books = await PriceBook.find(filter).lean<IPriceBook[]>();
  const active = books.find(b => isWithinPeriod(now, b.effectiveFrom, b.effectiveTo));
  return active || null;
}

export async function resolveActiveDiscountPolicy(): Promise<IDiscountPolicy | null> {
  const now = new Date();
  const policies = await DiscountPolicy.find({ isActive: true }).lean<IDiscountPolicy[]>();
  const active = policies.find(p => isWithinPeriod(now, p.effectiveFrom, p.effectiveTo));
  return active || null;
}

export async function checkDiscountGuardrails(lines: LineInput[], ctx: GuardrailContext): Promise<GuardrailResult> {
  const violations: GuardrailResult['violations'] = [];
  let requiresApproval = false;

  const settings = await Settings.findOne({}).lean<ISettings | null>();
  const priceBook = await resolveActivePriceBook(ctx.customerGroup);
  const policy = await resolveActiveDiscountPolicy();

  lines.forEach((line, index) => {
    const lineDiscount = line.discount ?? 0;

    // 1) จาก PriceBook: จำกัดส่วนลดสูงสุดต่อสินค้า/หมวด/หน่วย
    if (priceBook) {
      const matched = priceBook.rules.find(r =>
        (r.productId && r.productId === line.productId) ||
        (r.category && r.category === line.category) ||
        (!r.productId && !r.category)
      );
      if (matched && typeof matched.maxDiscountPercent === 'number') {
        if (lineDiscount > matched.maxDiscountPercent) {
          violations.push({ code: 'DISCOUNT_EXCEEDS_PRICEBOOK', message: `ส่วนลดแถว #${index + 1} เกินจาก PriceBook`, lineIndex: index });
        }
      }
    }

    // 2) จาก DiscountPolicy: ตรวจตามกติกา role/customerGroup/qty
    if (policy) {
      const matchedRule = policy.rules.find(r => {
        const c = r.conditions || {} as any;
        if (c.customerGroup && c.customerGroup !== ctx.customerGroup) return false;
        if (c.role && c.role !== ctx.role) return false;
        if (c.productId && c.productId !== line.productId) return false;
        if (c.category && c.category !== line.category) return false;
        if (typeof c.minQuantity === 'number' && line.quantity < c.minQuantity) return false;
        if (typeof c.maxQuantity === 'number' && line.quantity > c.maxQuantity) return false;
        return true;
      });

      if (matchedRule && typeof matchedRule.maxDiscountPercent === 'number') {
        if (lineDiscount > matchedRule.maxDiscountPercent) {
          requiresApproval = matchedRule.requireApprovalIfExceed !== false;
          violations.push({ code: 'DISCOUNT_EXCEEDS_POLICY', message: `ส่วนลดแถว #${index + 1} เกินจากนโยบาย`, lineIndex: index });
        }
      }
    }
  });

  // 3) Global guardrail จาก Settings: maxDiscountPercentWithoutApproval
  const globalMax = settings?.salesPolicy?.maxDiscountPercentWithoutApproval;
  if (typeof globalMax === 'number') {
    lines.forEach((line, index) => {
      if ((line.discount ?? 0) > globalMax) {
        requiresApproval = true;
        violations.push({ code: 'DISCOUNT_EXCEEDS_GLOBAL_MAX', message: `ส่วนลดแถว #${index + 1} เกินลิมิตที่กำหนด ต้องขออนุมัติ`, lineIndex: index });
      }
    });
  }

  return {
    ok: violations.length === 0,
    requiresApproval,
    violations,
  };
}


