import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/models/User';
import { verifyToken } from '@/lib/auth';

// ดึงข้อมูลใบกำกับภาษี
export async function GET(request: NextRequest) {
  try {
    const authResult = await verifyToken(request);
    
    if (!authResult.valid) {
      return NextResponse.json({ error: 'ไม่มีสิทธิ์เข้าถึง' }, { status: 401 });
    }

    await connectDB();
    
    const user = await User.findById(authResult.decoded.userId)
      .select('taxInvoiceInfo')
      .lean();

    if (!user) {
      return NextResponse.json({ error: 'ไม่พบผู้ใช้' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: user.taxInvoiceInfo || null
    });

  } catch (error) {
    console.error('Error fetching tax invoice info:', error);
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการดึงข้อมูลใบกำกับภาษี' },
      { status: 500 }
    );
  }
}

// อัปเดตข้อมูลใบกำกับภาษี
export async function PUT(request: NextRequest) {
  try {
    const authResult = await verifyToken(request);
    
    if (!authResult.valid) {
      return NextResponse.json({ error: 'ไม่มีสิทธิ์เข้าถึง' }, { status: 401 });
    }

    await connectDB();
    
    const { companyName, taxId, companyAddress, companyPhone, companyEmail } = await request.json();

    if (!companyName || !taxId) {
      return NextResponse.json({ error: 'ต้องระบุชื่อบริษัทและเลขประจำตัวผู้เสียภาษี' }, { status: 400 });
    }

    const user = await User.findById(authResult.decoded.userId);

    if (!user) {
      return NextResponse.json({ error: 'ไม่พบผู้ใช้' }, { status: 404 });
    }

    // อัปเดตข้อมูลใบกำกับภาษี
    user.taxInvoiceInfo = {
      companyName,
      taxId,
      companyAddress: companyAddress || '',
      companyPhone: companyPhone || '',
      companyEmail: companyEmail || ''
    };

    await user.save();

    return NextResponse.json({
      success: true,
      data: user.taxInvoiceInfo
    });

  } catch (error) {
    console.error('Error updating tax invoice info:', error);
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการอัปเดตข้อมูลใบกำกับภาษี' },
      { status: 500 }
    );
  }
} 