import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Customer from '@/models/Customer';

/**
 * API สำหรับตรวจสอบว่าเลขผู้เสียภาษีซ้ำหรือไม่
 * GET /api/customers/check-tax-id?taxId=xxx&excludeId=yyy
 */
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const taxId = searchParams.get('taxId');
        const excludeId = searchParams.get('excludeId'); // สำหรับกรณีแก้ไขลูกค้า

        if (!taxId) {
            return NextResponse.json(
                { error: 'กรุณาระบุเลขผู้เสียภาษี' },
                { status: 400 }
            );
        }

        // Validate taxId format (13 digits)
        if (!/^\d{13}$/.test(taxId)) {
            return NextResponse.json(
                { error: 'เลขผู้เสียภาษีต้องเป็นตัวเลข 13 หลัก', valid: false },
                { status: 400 }
            );
        }

        await connectDB();

        // Build query
        const query: any = { taxId };
        if (excludeId) {
            query._id = { $ne: excludeId };
        }

        // Check if customer with this taxId exists
        const existingCustomer = await Customer.findOne(query).select('name customerCode').lean();

        if (existingCustomer) {
            return NextResponse.json({
                exists: true,
                customerName: (existingCustomer as any).name,
                customerCode: (existingCustomer as any).customerCode,
                message: `พบลูกค้าที่ใช้เลขผู้เสียภาษีนี้แล้ว: ${(existingCustomer as any).name}`,
            });
        }

        return NextResponse.json({
            exists: false,
            message: 'เลขผู้เสียภาษีนี้พร้อมใช้งาน',
        });

    } catch (error) {
        console.error('Error checking tax ID:', error);
        return NextResponse.json(
            { error: 'เกิดข้อผิดพลาดในการตรวจสอบเลขผู้เสียภาษี' },
            { status: 500 }
        );
    }
}
