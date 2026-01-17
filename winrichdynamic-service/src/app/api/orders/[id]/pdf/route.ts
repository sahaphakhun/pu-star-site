import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Order from '@/models/Order';
import Admin from '@/models/Admin';
import { Settings } from '@/models/Settings';
import Product from '@/models/Product';
import { generatePDFFromHTML } from '@/utils/pdfUtils';
import { generateSalesOrderHTML } from '@/utils/salesOrderPdf';
import { cookies } from 'next/headers';
import * as jose from 'jose';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const resolvedParams = await params;
    const order: any = await Order.findById(resolvedParams.id).lean();

    if (!order) {
      return NextResponse.json({ error: 'ไม่พบใบสั่งขาย' }, { status: 404 });
    }

    const settings: any = await Settings.findOne().lean();
    const productIds = (order.items || [])
      .map((item: any) => item.productId)
      .filter(Boolean)
      .map((id: any) => String(id));
    const products = productIds.length
      ? await Product.find({ _id: { $in: productIds } }).lean()
      : [];
    const imageMap = (products as any[]).reduce<Record<string, string>>((acc, product) => {
      const key = String(product._id);
      if (product.imageUrl) acc[key] = String(product.imageUrl);
      return acc;
    }, {});

    let signatureInfo: any = {};
    if (order.ownerId) {
      const owner: any = await Admin.findById(order.ownerId).lean();
      if (owner) {
        signatureInfo = {
          ...signatureInfo,
          sellerName: owner.name || undefined,
          sellerSignatureUrl: owner.signatureUrl || undefined,
          sellerPosition: owner.position || undefined,
        };
      }
    }

    try {
      const authHeader = request.headers.get('authorization');
      const bearer = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : undefined;
      const cookieToken = (await cookies()).get('b2b_token')?.value;
      const token = bearer || cookieToken;
      if (token) {
        const payload: any = jose.decodeJwt(token);
        const requesterId = payload?.adminId ? String(payload.adminId) : undefined;
        if (requesterId && String(order.ownerId || '') !== requesterId) {
          const requester: any = await Admin.findById(requesterId).lean();
          if (requester) {
            signatureInfo = {
              ...signatureInfo,
              approverName: requester.name || undefined,
              approverSignatureUrl: requester.signatureUrl || undefined,
              approverPosition: requester.position || undefined,
            };
          }
        }
      }
    } catch { }

    const orderWithSettings = {
      ...order,
      items: (order.items || []).map((item: any) => ({
        ...item,
        imageUrl: item.productId ? imageMap[String(item.productId)] : undefined,
      })),
      companyName: settings?.companyName || undefined,
      companyAddress: settings?.companyAddress || undefined,
      companyPhone: settings?.companyPhone || undefined,
      companyEmail: settings?.companyEmail || undefined,
      taxId: settings?.taxId || undefined,
      logoUrl: settings?.logoUrl || undefined,
    };

    const html = generateSalesOrderHTML(orderWithSettings, signatureInfo);
    const pdfBuffer = await generatePDFFromHTML(html);

    const fileName = `ใบสั่งขาย_${order.salesOrderNumber || 'unknown'}.pdf`;
    const asciiFileName = `sales_order_${order.salesOrderNumber || 'unknown'}.pdf`;
    const encodedFileName = encodeURIComponent(fileName);

    return new NextResponse(pdfBuffer as any, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${asciiFileName}"; filename*=UTF-8''${encodedFileName}`,
      },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : '';
    console.error('[Sales Order PDF API] Error:', errorMessage);
    console.error('[Sales Order PDF API] Stack:', errorStack);
    console.error('[Sales Order PDF API] PUPPETEER_EXECUTABLE_PATH:', process.env.PUPPETEER_EXECUTABLE_PATH);
    return NextResponse.json({ error: 'เกิดข้อผิดพลาดในการสร้าง PDF', details: errorMessage }, { status: 500 });
  }
}
