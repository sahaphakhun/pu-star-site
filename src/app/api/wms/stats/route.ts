import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Product from '@/models/Product';

export async function GET() {
  try {
    await connectDB();
    
    // คำนวณสถิติต่างๆ
    const totalProducts = await Product.countDocuments();
    const totalStock = await Product.aggregate([
      { $group: { _id: null, total: { $sum: '$stock' } } }
    ]);
    
    const lowStockItems = await Product.countDocuments({
      $expr: { $lte: ['$stock', '$minStock'] }
    });
    
    const outOfStockItems = await Product.countDocuments({ stock: 0 });
    
    const totalValue = await Product.aggregate([
      { $group: { _id: null, total: { $sum: { $multiply: ['$stock', '$cost'] } } } }
    ]);

    // สร้างข้อมูลการเคลื่อนไหวล่าสุด (mock data สำหรับตอนนี้)
    const recentMovements = [
      {
        id: '1',
        type: 'in' as const,
        productName: 'สินค้าตัวอย่าง 1',
        quantity: 100,
        reference: 'ใบสั่งซื้อ PO001',
        timestamp: new Date().toISOString()
      },
      {
        id: '2',
        type: 'out' as const,
        productName: 'สินค้าตัวอย่าง 2',
        quantity: 50,
        reference: 'ใบสั่งขาย SO001',
        timestamp: new Date(Date.now() - 86400000).toISOString()
      },
      {
        id: '3',
        type: 'adjustment' as const,
        productName: 'สินค้าตัวอย่าง 3',
        quantity: 10,
        reference: 'การปรับปรุงสต็อก',
        timestamp: new Date(Date.now() - 172800000).toISOString()
      }
    ];

    const stats = {
      totalProducts,
      totalStock: totalStock[0]?.total || 0,
      lowStockItems,
      outOfStockItems,
      totalValue: totalValue[0]?.total || 0,
      recentMovements
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error('[WMS Stats API] Error:', error);
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการดึงข้อมูลสถิติ' },
      { status: 500 }
    );
  }
}
