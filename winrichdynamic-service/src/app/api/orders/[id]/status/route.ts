import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Order from '@/models/Order';
import Quotation from '@/models/Quotation';
import { verifyToken } from '@/lib/auth';
import { generateQuotationFromOrder } from '@/services/quotationGenerator';
import { generateSalesOrderFromQuotation } from '@/services/salesOrderGenerator';

async function ensureSalesOrderFromQuotation(order: any) {
  try {
    let quotationId = order.generatedQuotationId;

    if (!quotationId) {
      const quotation = await generateQuotationFromOrder(order._id.toString(), {
        autoConvertToSalesOrder: false,
        requireAdminApproval: true,
        conversionDelay: 0,
        customValidityDays: 7
      });
      quotationId = quotation._id.toString();
    }

    if (!quotationId) return;

    const quotation = await Quotation.findById(quotationId);
    if (!quotation) return;

    if (quotation.status !== 'accepted') {
      quotation.status = 'accepted';
      quotation.respondedAt = new Date();
      quotation.responseNotes = 'ยืนยันออเดอร์ออนไลน์โดยระบบ';
      await quotation.save();
    }

    if (!quotation.convertedToOrder && !order.linkedSalesOrderId) {
      await generateSalesOrderFromQuotation(quotation._id.toString(), {
        requireAdminApproval: true,
        customPaymentMethod: order.paymentMethod,
        customShippingFee: order.shippingFee,
        notes: `สร้างอัตโนมัติจากการยืนยันคำสั่งซื้อ #${order._id.toString().slice(-6)}`
      });
    }
  } catch (error) {
    console.error('[B2B] Error ensuring sales order from quotation:', error);
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = verifyToken(request);
    if (!auth.valid) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    await connectDB();
    const { status } = await request.json();
    const resolvedParams = await params;
    let doc = await Order.findByIdAndUpdate(resolvedParams.id, { status }, { new: true });
    if (!doc) return NextResponse.json({ error: 'ไม่พบคำสั่งซื้อ' }, { status: 404 });

    if (status === 'confirmed') {
      await ensureSalesOrderFromQuotation(doc);
      doc = await Order.findById(resolvedParams.id);
    }

    return NextResponse.json(doc);
  } catch (error) {
    console.error('[B2B] Error updating order status:', error);
    return NextResponse.json({ error: 'เกิดข้อผิดพลาดในการอัปเดตสถานะ' }, { status: 500 });
  }
}

