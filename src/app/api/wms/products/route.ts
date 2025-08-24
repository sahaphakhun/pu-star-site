import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Product from '@/models/Product';

export async function GET() {
  try {
    await connectDB();
    
    // ดึงข้อมูลสินค้าทั้งหมดพร้อมข้อมูลที่จำเป็นสำหรับ WMS
    const products = await Product.find({}, {
      name: 1,
      sku: 1,
      category: 1,
      stock: 1,
      minStock: 1,
      maxStock: 1,
      unit: 1,
      cost: 1,
      location: 1,
      lastUpdated: 1
    }).lean();

    // แปลงข้อมูลให้ตรงกับ interface ที่ต้องการ
    const wmsProducts = products.map(product => ({
      _id: product._id.toString(),
      name: product.name,
      sku: product.sku,
      category: product.category || 'ไม่ระบุ',
      stock: product.stock || 0,
      minStock: product.minStock || 0,
      maxStock: product.maxStock || 0,
      unit: product.unit || 'ชิ้น',
      cost: product.cost || 0,
      location: product.location || 'ไม่ระบุ',
      lastUpdated: product.updatedAt || product.createdAt || new Date().toISOString()
    }));

    return NextResponse.json(wmsProducts);
  } catch (error) {
    console.error('[WMS Products API] Error:', error);
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการดึงข้อมูลสินค้า' },
      { status: 500 }
    );
  }
}
