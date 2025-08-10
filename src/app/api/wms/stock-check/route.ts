import { NextRequest, NextResponse } from 'next/server';
import { wmsService } from '@/lib/wms';
import Product from '@/models/Product';
import Order from '@/models/Order';
import connectToDatabase from '@/lib/mongodb';
import type { WMSVariantConfig } from '@/types/wms';
import mongoose from 'mongoose';

function buildVariantKey(unitLabel?: string, selectedOptions?: Record<string, string>): string {
  const unitPart = unitLabel ? `unit:${unitLabel}` : 'unit:default';
  const optionsPart = selectedOptions && Object.keys(selectedOptions).length > 0
    ? 'opts:' + Object.keys(selectedOptions).sort().map(k => `${k}:${selectedOptions[k]}`).join('|')
    : 'opts:none';
  return `${unitPart}__${optionsPart}`;
}

export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();
    
    const { orderId, productIds } = await request.json();

    if (!orderId) {
      return NextResponse.json(
        { error: 'Order ID is required' },
        { status: 400 }
      );
    }

    // ดึงข้อมูลออเดอร์
    const order = await Order.findById(orderId).populate('items.productId');
    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    const stockCheckResults = [];
    let overallStatus: 'checked' | 'insufficient' | 'error' = 'checked';

    // ตรวจสอบสต็อกสำหรับแต่ละสินค้าในออเดอร์ (รองรับ WMS ต่อ variant)
    for (const item of order.items) {
      // รองรับทั้งกรณีที่ populate แล้ว (Document) และยังเป็น ObjectId อยู่
      const rawProductId: any = (item as any).productId;
      const productIdStr = rawProductId && typeof rawProductId === 'object' && rawProductId._id
        ? String(rawProductId._id)
        : String(rawProductId);

      let product: any;
      if (rawProductId && typeof rawProductId === 'object' && rawProductId._id) {
        product = typeof rawProductId.toObject === 'function' ? rawProductId.toObject() : rawProductId;
      } else {
        // ป้องกันกรณี productId ไม่ใช่ ObjectId (เช่น ออเดอร์ manual) เพื่อไม่ให้ CastError แล้วกลายเป็น 500
        if (!mongoose.Types.ObjectId.isValid(productIdStr)) {
          stockCheckResults.push({
            productId: productIdStr,
            productCode: 'N/A',
            requestedQuantity: item.quantity,
            availableQuantity: 0,
            status: 'not_found',
            message: 'สินค้าไม่ได้เชื่อมกับฐานข้อมูล (เช่น ออเดอร์ที่สร้างแบบ manual) จึงไม่สามารถตรวจ WMS ได้'
          });
          overallStatus = overallStatus === 'error' ? 'error' : 'insufficient';
          continue;
        }
        product = await Product.findById(rawProductId).lean();
      }

      if (!product) {
        stockCheckResults.push({
          productId: productIdStr,
          productCode: 'N/A',
          requestedQuantity: item.quantity,
          availableQuantity: 0,
          status: 'error',
          message: 'ไม่พบสินค้าในระบบ'
        });
        overallStatus = 'error';
        continue;
      }

      // สร้างกุญแจ variant จาก unit + selectedOptions เพื่อจับคู่ config ที่ตรง
      const variantKey = buildVariantKey(item.unitLabel, item.selectedOptions);

      let matchedVariant: WMSVariantConfig | undefined;
      const variantConfigs = (product as any).wmsVariantConfigs as WMSVariantConfig[] | undefined;
      if (Array.isArray(variantConfigs) && variantConfigs.length > 0) {
        matchedVariant = variantConfigs.find(vc => vc.key === variantKey && (vc.isEnabled ?? true));
      }

      if (!matchedVariant) {
        // ถ้าไม่มี variant config ให้ fallback ไปที่ product-level config (ถ้ามีและเปิดใช้งาน)
        const wmsCfg = (product as any).wmsConfig;
        if (!wmsCfg || !wmsCfg.isEnabled) {
          stockCheckResults.push({
            productId: item.productId.toString(),
            productCode: 'N/A',
            requestedQuantity: item.quantity,
            availableQuantity: 0,
            status: 'not_found',
            message: 'ไม่มีการตั้งค่า WMS สำหรับสินค้านี้หรือ variant นี้'
          });
          overallStatus = overallStatus === 'error' ? 'error' : 'insufficient';
          continue;
        }

        const stockResult = await wmsService.checkStockQuantity({
          productCode: wmsCfg.productCode,
          lotGen: wmsCfg.lotGen,
          locationBin: wmsCfg.locationBin,
          lotMfg: wmsCfg.lotMfg,
          adminUsername: wmsCfg.adminUsername
        });

        const isAvailable = stockResult.quantity >= item.quantity;
        const baseStatus = stockResult.status === 'out_of_stock' ? 'insufficient' : stockResult.status;
        const itemStatus = baseStatus === 'available'
          ? (isAvailable ? 'available' : 'insufficient')
          : baseStatus;
        stockCheckResults.push({
          productId: productIdStr,
          productCode: wmsCfg.productCode,
          requestedQuantity: item.quantity,
          availableQuantity: stockResult.quantity,
          status: itemStatus,
          message: [
            stockResult.message,
            stockResult.rawStatus ? `(raw:${stockResult.rawStatus})` : '',
            stockResult.requestUrl ? `(url:${stockResult.requestUrl})` : ''
          ].filter(Boolean).join(' ')
        });

        if (itemStatus === 'insufficient' || itemStatus === 'not_found') {
          overallStatus = 'insufficient';
        } else if (itemStatus === 'error') {
          overallStatus = 'error';
        }
        continue;
      }

      // ใช้ variant-level config
      const stockResult = await wmsService.checkStockForVariant(matchedVariant);
      const isAvailable = stockResult.quantity >= item.quantity;
      const baseStatus = stockResult.status === 'out_of_stock' ? 'insufficient' : stockResult.status;
      const itemStatus = baseStatus === 'available'
        ? (isAvailable ? 'available' : 'insufficient')
        : baseStatus;

      stockCheckResults.push({
        productId: productIdStr,
        productCode: matchedVariant.productCode,
        requestedQuantity: item.quantity,
        availableQuantity: stockResult.quantity,
        status: itemStatus,
        message: [
          stockResult.message,
          stockResult.rawStatus ? `(raw:${stockResult.rawStatus})` : '',
          stockResult.requestUrl ? `(url:${stockResult.requestUrl})` : ''
        ].filter(Boolean).join(' ')
      });

      if (itemStatus === 'insufficient' || itemStatus === 'not_found') {
        overallStatus = 'insufficient';
      } else if (itemStatus === 'error') {
        overallStatus = 'error';
      }
    }

    // อัพเดทข้อมูล WMS ในออเดอร์
    await Order.findByIdAndUpdate(orderId, {
      'wmsData.stockCheckStatus': overallStatus,
      'wmsData.stockCheckResults': stockCheckResults,
      'wmsData.lastStockCheck': new Date()
    });

    return NextResponse.json({
      success: true,
      orderId,
      overallStatus,
      results: stockCheckResults,
      message: overallStatus === 'checked' 
        ? 'ตรวจสอบสต็อกเรียบร้อย สินค้าทั้งหมดมีเพียงพอ'
        : overallStatus === 'insufficient'
        ? 'สินค้าบางรายการไม่เพียงพอ'
        : 'เกิดข้อผิดพลาดในการตรวจสอบสต็อก'
    });

  } catch (error) {
    console.error('WMS Stock Check Error:', error);
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการตรวจสอบสต็อก' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();
    
    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get('orderId');

    if (!orderId) {
      return NextResponse.json(
        { error: 'Order ID is required' },
        { status: 400 }
      );
    }

    const order = await Order.findById(orderId).select('wmsData');
    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      wmsData: order.wmsData || {
        stockCheckStatus: 'pending',
        stockCheckResults: [],
        lastStockCheck: null
      }
    });

  } catch (error) {
    console.error('Get WMS Data Error:', error);
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการดึงข้อมูล WMS' },
      { status: 500 }
    );
  }
}