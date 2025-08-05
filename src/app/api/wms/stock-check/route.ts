import { NextRequest, NextResponse } from 'next/server';
import { wmsService } from '@/lib/wms';
import Product from '@/models/Product';
import Order from '@/models/Order';
import { connectToDatabase } from '@/lib/mongodb';

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

    // ตรวจสอบสต็อกสำหรับแต่ละสินค้าในออเดอร์
    for (const item of order.items) {
      const product = await Product.findById(item.productId);
      
      if (!product || !product.wmsConfig || !product.wmsConfig.isEnabled) {
        // ถ้าสินค้าไม่มี WMS config หรือไม่เปิดใช้งาน ให้ถือว่าพร้อมใช้งาน
        stockCheckResults.push({
          productId: item.productId.toString(),
          productCode: 'N/A',
          requestedQuantity: item.quantity,
          availableQuantity: item.quantity, // สมมติว่ามีเพียงพอ
          status: 'available',
          message: 'ไม่มีการตั้งค่า WMS สำหรับสินค้านี้'
        });
        continue;
      }

      // เรียก WMS API ตรวจสอบสต็อก
      const stockResult = await wmsService.checkStockQuantity({
        productCode: product.wmsConfig.productCode,
        lotGen: product.wmsConfig.lotGen,
        locationBin: product.wmsConfig.locationBin,
        lotMfg: product.wmsConfig.lotMfg,
        adminUsername: product.wmsConfig.adminUsername
      });

      const isAvailable = stockResult.quantity >= item.quantity;
      const itemStatus = stockResult.status === 'available' && isAvailable 
        ? 'available' 
        : stockResult.status === 'available' && !isAvailable
        ? 'insufficient'
        : stockResult.status;

      stockCheckResults.push({
        productId: item.productId.toString(),
        productCode: product.wmsConfig.productCode,
        requestedQuantity: item.quantity,
        availableQuantity: stockResult.quantity,
        status: itemStatus,
        message: stockResult.message
      });

      // อัพเดท overall status
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