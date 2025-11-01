import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import SessionModel from '@/models/Session';

export async function POST(request: Request) {
  try {
    console.log('[AUTO_CLEAR_CART] Starting automatic cart clearing at:', new Date());
    
    await connectDB();
    
    // ล้างตะกร้าสินค้าของผู้ใช้ทุกคน
    const result = await SessionModel.updateMany(
      { 'cart.0': { $exists: true } }, // เฉพาะ session ที่มีสินค้าในตะกร้า
      { 
        $set: { 
          cart: [], 
          updatedAt: new Date() 
        } 
      }
    );
    
    console.log('[AUTO_CLEAR_CART] Cleared carts from sessions:', result.modifiedCount);
    
    return NextResponse.json({ 
      success: true, 
      message: `ล้างตะกร้าสินค้าอัตโนมัติเสร็จสิ้น จำนวน ${result.modifiedCount} session`,
      clearedCount: result.modifiedCount
    });
  } catch (error) {
    console.error('[AUTO_CLEAR_CART] Error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'เกิดข้อผิดพลาดในการล้างตะกร้าสินค้าอัตโนมัติ' 
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ 
    message: 'Auto cart clearing endpoint - use POST method' 
  });
} 