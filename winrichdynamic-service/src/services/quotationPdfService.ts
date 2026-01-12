import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Quotation from '@/models/Quotation';
import { Settings } from '@/models/Settings';
import { generatePDFFromHTML } from '@/utils/pdfUtils';
import { generateQuotationHTML } from '@/utils/quotationPdf';
import Product from '@/models/Product';
import Admin from '@/models/Admin';
import * as jose from 'jose';
import { cookies } from 'next/headers';

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

export async function buildQuotationPdfResponse(
  request: NextRequest,
  quotationId: string
) {
  await connectDB();

  const quotation = await Quotation.findById(quotationId).lean();
  if (!quotation) {
    return NextResponse.json({ error: 'ไม่พบใบเสนอราคา' }, { status: 404 });
  }

  let requesterAdminId: string | undefined;
  let requesterRoleName: string | undefined;
  try {
    const authHeader = request.headers.get('authorization');
    const bearer =
      authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : undefined;
    const cookieToken = (await cookies()).get('b2b_token')?.value;
    const token = bearer || cookieToken;
    if (token) {
      const payload: any = jose.decodeJwt(token);
      const roleName = String(payload.role || '').toLowerCase();
      requesterRoleName = roleName;
      requesterAdminId = payload?.adminId ? String(payload.adminId) : undefined;
      if (roleName === 'seller' && String((quotation as any).assignedTo) !== String(payload.adminId)) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }
  } catch {}

  const settings = await Settings.findOne();
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
    return {
      ...item,
      sku: resolvedSku || undefined,
      selectedOptions: hasItemOptions ? itemOptions : stripEmptyOptions(matchedVariant?.options),
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
            ...signatureInfo,
            quoterName: admin.name || undefined,
            quoterSignatureUrl: admin.signatureUrl || undefined,
            quoterPosition: admin.position || undefined,
          };
        }
      }
    }
  } catch {}

  try {
    if (requesterAdminId) {
      const requester: any = await Admin.findById(requesterAdminId).lean();
      if (requester && (requester.signatureUrl || requester.name)) {
        if (requesterRoleName === 'seller' && !signatureInfo?.quoterSignatureUrl) {
          signatureInfo = {
            ...signatureInfo,
            quoterName: requester.name || signatureInfo.quoterName,
            quoterSignatureUrl: requester.signatureUrl || signatureInfo.quoterSignatureUrl,
            quoterPosition: requester.position || signatureInfo.quoterPosition,
          };
        } else if (requesterRoleName && requesterRoleName !== 'seller') {
          signatureInfo = {
            ...signatureInfo,
            approverName: requester.name || undefined,
            approverSignatureUrl: requester.signatureUrl || undefined,
            approverPosition: requester.position || undefined,
          };
        }
      }
    }
  } catch {}

  const quotationWithSettings = {
    ...quotation,
    items: enrichedItems,
    ...salesInfo,
    logoUrl: settings?.logoUrl || '',
    companyName: settings?.companyName || undefined,
    companyAddress: settings?.companyAddress || undefined,
    companyPhone: settings?.companyPhone || undefined,
    companyEmail: settings?.companyEmail || undefined,
    companyWebsite: settings?.companyWebsite || undefined,
    taxId: settings?.taxId || undefined,
    bankInfo: settings?.bankInfo || undefined,
  };

  const html = generateQuotationHTML(quotationWithSettings as any, signatureInfo);
  const pdfBuffer = await generatePDFFromHTML(html);

  const fileName = `ใบเสนอราคา_${(quotation as any).quotationNumber || 'unknown'}.pdf`;
  const asciiFileName = `quotation_${(quotation as any).quotationNumber || 'unknown'}.pdf`;
  const encodedFileName = encodeURIComponent(fileName);
  const url = new URL(request.url);
  const inlineParam = url.searchParams.get('inline');
  const downloadParam = url.searchParams.get('download');
  const isInline = inlineParam === '1' || inlineParam === 'true';
  const isDownload = downloadParam === '1' || downloadParam === 'true';
  const dispositionType = isInline && !isDownload ? 'inline' : 'attachment';

  return new NextResponse(pdfBuffer as any, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `${dispositionType}; filename="${asciiFileName}"; filename*=UTF-8''${encodedFileName}`,
    },
  });
}
