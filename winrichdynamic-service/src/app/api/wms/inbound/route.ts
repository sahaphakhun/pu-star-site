import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import PurchaseOrder from '@/models/PurchaseOrder';
import ASN from '@/models/ASN';

export async function GET() {
  try {
    await connectDB();

    const purchaseOrders = await PurchaseOrder.find()
      .sort({ orderDate: -1 })
      .limit(200)
      .lean();
    const asns = await ASN.find()
      .sort({ deliveryDate: -1 })
      .limit(200)
      .lean();

    const mappedPOs = purchaseOrders.map((po: any) => ({
      id: String(po._id),
      poNumber: po.poNumber,
      supplier: po.supplier,
      orderDate: po.orderDate,
      expectedDelivery: po.expectedDelivery,
      status: po.status,
      totalItems: po.totalItems || 0,
      receivedItems: po.receivedItems || 0,
      totalValue: po.totalValue || 0,
    }));

    const mappedASNs = asns.map((asn: any) => ({
      id: String(asn._id),
      asnNumber: asn.asnNumber,
      poNumber: asn.poNumber,
      supplier: asn.supplier,
      deliveryDate: asn.deliveryDate,
      status: asn.status,
      items: Array.isArray(asn.items) ? asn.items : [],
    }));

    return NextResponse.json({ purchaseOrders: mappedPOs, asns: mappedASNs });
  } catch (error) {
    console.error('[WMS] GET /wms/inbound error', error);
    return NextResponse.json(
      { error: 'Unable to load inbound data' },
      { status: 500 }
    );
  }
}
