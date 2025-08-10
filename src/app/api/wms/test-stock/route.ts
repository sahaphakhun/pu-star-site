import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Product from '@/models/Product';
import { wmsService } from '@/lib/wms';
import type { WMSVariantConfig } from '@/types/wms';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const { productId, variantKey } = await request.json();

    if (!productId) {
      return NextResponse.json({ error: 'productId is required' }, { status: 400 });
    }

    const product = await Product.findById(productId).lean();
    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    const anyProduct: any = product as any;
    const variantConfigs: WMSVariantConfig[] | undefined = anyProduct.wmsVariantConfigs;

    const runCheckForVariant = async (cfg: WMSVariantConfig) => {
      const r = await wmsService.checkStockForVariant(cfg);
      return {
        key: cfg.key,
        productCode: r.productCode,
        quantity: r.quantity,
        status: r.status,
        message: r.message,
      } as const;
    };

    const runCheckForProductLevel = async () => {
      const wmsCfg = anyProduct.wmsConfig;
      if (!wmsCfg?.isEnabled) return null;
      const r = await wmsService.checkStockQuantity({
        productCode: wmsCfg.productCode,
        lotGen: wmsCfg.lotGen,
        locationBin: wmsCfg.locationBin,
        lotMfg: wmsCfg.lotMfg,
        adminUsername: wmsCfg.adminUsername,
      });
      return {
        key: 'product-level',
        productCode: r.productCode,
        quantity: r.quantity,
        status: r.status,
        message: r.message,
      } as const;
    };

    let results: Array<{
      key: string;
      productCode: string;
      quantity: number;
      status: 'available' | 'out_of_stock' | 'not_found' | 'error';
      message?: string;
    }> = [];

    if (variantKey) {
      const matched = (variantConfigs || []).find(
        (v) => v.key === variantKey && (v.isEnabled ?? true)
      );
      if (!matched) {
        return NextResponse.json(
          { error: 'Variant config not found or disabled' },
          { status: 400 }
        );
      }
      results = [await runCheckForVariant(matched)];
    } else if (Array.isArray(variantConfigs) && variantConfigs.length > 0) {
      const enabled = variantConfigs.filter((v) => v.isEnabled ?? true);
      if (enabled.length > 0) {
        results = await Promise.all(enabled.map(runCheckForVariant));
      } else {
        const pr = await runCheckForProductLevel();
        if (pr) results = [pr];
      }
    } else {
      const pr = await runCheckForProductLevel();
      if (pr) results = [pr];
    }

    if (!results || results.length === 0) {
      return NextResponse.json(
        { error: 'No WMS configuration found on this product' },
        { status: 400 }
      );
    }

    const counts = {
      available: results.filter((r) => r.status === 'available').length,
      out_of_stock: results.filter((r) => r.status === 'out_of_stock').length,
      not_found: results.filter((r) => r.status === 'not_found').length,
      error: results.filter((r) => r.status === 'error').length,
    } as const;

    return NextResponse.json({
      success: true,
      productId,
      tested: results.length,
      counts,
      results,
    });
  } catch (err) {
    console.error('WMS Test Stock Error:', err);
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการทดสอบตรวจสต็อก WMS' },
      { status: 500 }
    );
  }
}


