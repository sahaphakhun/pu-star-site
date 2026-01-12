import { NextRequest, NextResponse } from 'next/server';
import * as jose from 'jose';
import { cookies } from 'next/headers';
import connectDB from '@/lib/mongodb';
import Quotation from '@/models/Quotation';
import { Settings } from '@/models/Settings';
import Product from '@/models/Product';
import Admin from '@/models/Admin';

const DEFAULT_COMPANY = {
  companyName: 'บริษัท วินริช ไดนามิก จำกัด',
  companyAddress: '123 ถนนสุขุมวิท แขวงคลองเตย เขตวัฒนา กรุงเทพฯ 10110',
  companyPhone: '02-123-4567',
  companyEmail: 'info@winrichdynamic.com',
  companyWebsite: 'winrichdynamic.com',
  taxId: '0105563000000',
};

const DEFAULT_BANK = {
  bankName: 'กสิกรไทย',
  accountNumber: '123-4-56789-0',
  branch: 'อโศก',
};

type OptionRecord = Record<string, string>;

const normalizeOptionRecord = (options: any): OptionRecord => {
  if (!options || typeof options !== 'object') return {};
  const entries = options instanceof Map ? Array.from(options.entries()) : Object.entries(options);
  return entries.reduce<OptionRecord>((acc, [key, value]) => {
    const normalizedKey = String(key || '').trim();
    const normalizedValue = String(value ?? '').trim();
    if (normalizedKey && normalizedValue) {
      acc[normalizedKey] = normalizedValue;
    }
    return acc;
  }, {});
};

const stripEmptyOptions = (options: any): OptionRecord | undefined => {
  const normalized = normalizeOptionRecord(options);
  return Object.keys(normalized).length ? normalized : undefined;
};

const optionsMatch = (left: OptionRecord, right: OptionRecord) => {
  const leftKeys = Object.keys(left);
  const rightKeys = Object.keys(right);
  if (leftKeys.length !== rightKeys.length) return false;
  return leftKeys.every((key) => right[key] === left[key]);
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();

    const resolvedParams = await params;
    const quotation = await Quotation.findById(resolvedParams.id).lean();

    if (!quotation) {
      return NextResponse.json({ error: 'ไม่พบใบเสนอราคา' }, { status: 404 });
    }

    // RBAC: ถ้าเป็น Seller ต้องเป็นเจ้าของเท่านั้น
    try {
      const authHeader = request.headers.get('authorization');
      const bearer =
        authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : undefined;
      const cookieToken = (await cookies()).get('b2b_token')?.value;
      const token = bearer || cookieToken;
      if (token) {
        const payload: any = jose.decodeJwt(token);
        const roleName = String(payload.role || '').toLowerCase();
        if (roleName === 'seller' && String((quotation as any).assignedTo) !== String(payload.adminId)) {
          return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }
      }
    } catch {}

    const settings = await Settings.findOne().lean();
    const q: any = quotation as any;

    const productIds = (q.items || []).map((item: any) => item.productId).filter(Boolean);
    const products = productIds.length
      ? await Product.find({ _id: { $in: productIds } }).lean()
      : [];

    const skuMap: Record<
      string,
      {
        defaultSku?: string;
        unitSku: Record<string, string>;
        variants: Array<{
          sku?: string;
          unitLabel?: string;
          options: OptionRecord;
          isActive: boolean;
        }>;
      }
    > = {};

    for (const product of products as any[]) {
      const productId = String(product._id);
      const unitSku: Record<string, string> = {};
      if (Array.isArray(product.units)) {
        for (const unit of product.units) {
          if (unit?.label && unit?.sku) {
            unitSku[String(unit.label)] = String(unit.sku);
          }
        }
      }
      const variants = Array.isArray(product.skuVariants)
        ? product.skuVariants.map((variant: any) => ({
            sku: variant?.sku ? String(variant.sku) : undefined,
            unitLabel: variant?.unitLabel ? String(variant.unitLabel) : undefined,
            options: normalizeOptionRecord(variant?.options),
            isActive: variant?.isActive !== false,
          }))
        : [];

      skuMap[productId] = {
        defaultSku: product.sku ? String(product.sku) : undefined,
        unitSku,
        variants,
      };
    }

    const enrichedItems = (q.items || []).map((item: any) => {
      const productId = String(item.productId || '');
      const skuInfo = skuMap[productId] || { unitSku: {}, variants: [] };
      const unitSku = skuInfo.unitSku?.[String(item.unit || '')];
      const itemOptions = normalizeOptionRecord(item.selectedOptions);
      const hasItemOptions = Object.keys(itemOptions).length > 0;
      const matchedVariant = hasItemOptions
        ? skuInfo.variants.find((variant) => {
            if (!variant.isActive) return false;
            if (variant.unitLabel && String(variant.unitLabel) !== String(item.unit || '')) {
              return false;
            }
            return optionsMatch(variant.options, itemOptions);
          })
        : undefined;

      const resolvedSku =
        (typeof item.sku === 'string' && item.sku.trim()) ||
        matchedVariant?.sku ||
        unitSku ||
        skuInfo.defaultSku;

      const resolvedOptions = hasItemOptions
        ? itemOptions
        : stripEmptyOptions(matchedVariant?.options);

      return {
        ...item,
        sku: resolvedSku || undefined,
        selectedOptions: resolvedOptions,
      };
    });

    let salesInfo: any = {};
    let signatureInfo: any = {};
    try {
      const ownerId = (quotation as any).assignedTo;
      if (ownerId) {
        const admin: any = await Admin.findById(ownerId).lean();
        if (admin) {
          salesInfo = {
            salesName: admin.name || undefined,
            salesPhone: admin.phone || undefined,
            salesEmail: admin.email || undefined,
          };
          if (admin.signatureUrl || admin.name) {
            signatureInfo = {
              quoterName: admin.name || undefined,
              quoterSignatureUrl: admin.signatureUrl || undefined,
              quoterPosition: admin.position || undefined,
            };
          }
        }
      }
    } catch {}

    const companyName = settings?.companyName || DEFAULT_COMPANY.companyName;
    const companyAddress = settings?.companyAddress || DEFAULT_COMPANY.companyAddress;
    const companyPhone = settings?.companyPhone || DEFAULT_COMPANY.companyPhone;
    const companyEmail = settings?.companyEmail || DEFAULT_COMPANY.companyEmail;
    const companyWebsite = settings?.companyWebsite || DEFAULT_COMPANY.companyWebsite;
    const taxId = settings?.taxId || DEFAULT_COMPANY.taxId;
    const bankInfo =
      settings?.bankInfo || {
        ...DEFAULT_BANK,
        accountName: companyName,
      };

    const quotationWithSettings = {
      ...quotation,
      items: enrichedItems,
      ...salesInfo,
      logoUrl: settings?.logoUrl || '',
      companyName,
      companyAddress,
      companyPhone,
      companyEmail,
      companyWebsite,
      taxId,
      bankInfo,
    };

    return NextResponse.json({ quotation: quotationWithSettings, signatures: signatureInfo });
  } catch (error) {
    console.error('[Public Quotation Data] GET Error:', error);
    return NextResponse.json({ error: 'เกิดข้อผิดพลาดในการดึงข้อมูลใบเสนอราคา' }, { status: 500 });
  }
}
