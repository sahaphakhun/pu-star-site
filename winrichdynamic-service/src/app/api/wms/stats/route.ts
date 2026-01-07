import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Product from '@/models/Product';
import Order from '@/models/Order';

const toNumber = (value: unknown, fallback = 0) => {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
};

const parseRangeDays = (range?: string | null) => {
  if (!range) return undefined;
  const match = range.match(/^(\d+)d$/);
  if (!match) return undefined;
  const days = Number(match[1]);
  return Number.isFinite(days) ? days : undefined;
};

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const url = new URL(request.url);
    const days = parseRangeDays(url.searchParams.get('range'));
    const since = days ? new Date(Date.now() - days * 24 * 60 * 60 * 1000) : undefined;

    const products = await Product.find({ isDeleted: { $ne: true } }).lean();
    const totalProducts = products.length;

    let totalStock = 0;
    let lowStockItems = 0;
    let outOfStockItems = 0;
    let totalValue = 0;

    products.forEach((product: any) => {
      const stock = toNumber(product.stock, 0);
      const minStock = toNumber(product.minStock, 0);
      const cost = toNumber(product.cost, toNumber(product.price, 0));
      totalStock += stock;
      totalValue += stock * cost;

      if (stock === 0) {
        outOfStockItems += 1;
      } else if (minStock > 0 && stock <= minStock) {
        lowStockItems += 1;
      }
    });

    const orderMatch: Record<string, any> = {};
    if (since) {
      orderMatch.updatedAt = { $gte: since };
    }

    const orders = await Order.find(orderMatch)
      .sort({ updatedAt: -1 })
      .limit(10)
      .lean();

    const recentMovements = orders.map((order: any) => {
      const items = Array.isArray(order.items) ? order.items : [];
      const totalQty = items.reduce((sum: number, item: any) => sum + toNumber(item.quantity, 0), 0);
      const firstItemName = items[0]?.name || 'Order';
      const productName = items.length > 1 ? `${firstItemName} +${items.length - 1}` : firstItemName;
      return {
        id: String(order._id),
        productName,
        type: 'out',
        quantity: totalQty,
        unit: items[0]?.unitLabel || 'pcs',
        date: order.updatedAt || order.createdAt,
        reference: order.salesOrderNumber || String(order._id),
      };
    });

    return NextResponse.json({
      totalProducts,
      totalStock,
      lowStockItems,
      outOfStockItems,
      totalValue,
      recentMovements,
    });
  } catch (error) {
    console.error('[WMS] GET /wms/stats error', error);
    return NextResponse.json(
      { error: 'Unable to load stats' },
      { status: 500 }
    );
  }
}
