import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Product from '@/models/Product';

// GET: ดึงข้อมูลสินค้าทั้งหมดสำหรับแอดมิน
export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const isAvailable = searchParams.get('isAvailable');
    
    let query: any = {};
    
    if (category) {
      query.category = category;
    }
    
    if (isAvailable !== null) {
      query.isAvailable = isAvailable === 'true';
    }
    
    const products = await Product.find(query)
      .select('_id name imageUrl category isAvailable')
      .sort({ createdAt: -1 });
    
    return NextResponse.json({ success: true, data: products });
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json(
      { success: false, error: 'เกิดข้อผิดพลาดในการดึงข้อมูลสินค้า' },
      { status: 500 }
    );
  }
}
