import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import SKUConfig from '@/models/SKUConfig';

// POST - สร้าง SKU ใหม่ตามรูปแบบที่กำหนด
export async function POST(request: NextRequest) {
  try {
    await connectDB();
    
    const body = await request.json();
    const { configId, productName, category } = body;
    
    if (!configId) {
      return NextResponse.json(
        { error: 'กรุณาระบุ SKU Config ID' },
        { status: 400 }
      );
    }
    
    // ดึงข้อมูล SKU Config
    const skuConfig = await SKUConfig.findById(configId);
    if (!skuConfig) {
      return NextResponse.json(
        { error: 'ไม่พบ SKU Config' },
        { status: 404 }
      );
    }
    
    if (!skuConfig.isActive) {
      return NextResponse.json(
        { error: 'SKU Config นี้ไม่สามารถใช้งานได้' },
        { status: 400 }
      );
    }
    
    // สร้าง SKU ตามรูปแบบ
    let sku = skuConfig.format;
    
    // แทนที่ตัวแปรในรูปแบบ
    sku = sku.replace(/{PREFIX}/g, skuConfig.prefix);
    sku = sku.replace(/{COUNTER}/g, skuConfig.counter.toString().padStart(4, '0'));
    sku = sku.replace(/{CATEGORY}/g, category || 'GEN');
    sku = sku.replace(/{YEAR}/g, new Date().getFullYear().toString());
    sku = sku.replace(/{MONTH}/g, (new Date().getMonth() + 1).toString().padStart(2, '0'));
    sku = sku.replace(/{DAY}/g, new Date().getDate().toString().padStart(2, '0'));
    
    // เพิ่มตัวนับ
    skuConfig.counter += 1;
    await skuConfig.save();
    
    return NextResponse.json({
      sku,
      configId: skuConfig._id,
      nextCounter: skuConfig.counter,
    });
  } catch (error) {
    console.error('[SKU Generate API] POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
