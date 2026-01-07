import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Product from '@/models/Product';

const toNumber = (value: unknown, fallback = 0) => {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
};

export async function GET() {
  try {
    await connectDB();

    const products = await Product.find({ isDeleted: { $ne: true } })
      .sort({ updatedAt: -1 })
      .lean();
    const mapped = products.map((product: any) => ({
      _id: product._id,
      name: product.name,
      sku: product.sku,
      category: product.category || 'Uncategorized',
      stock: toNumber(product.stock, 0),
      minStock: toNumber(product.minStock, 0),
      maxStock: toNumber(product.maxStock, 0),
      unit:
        product.unit ||
        (Array.isArray(product.units) && product.units[0]?.label) ||
        'pcs',
      cost: toNumber(product.cost, toNumber(product.price, 0)),
      location: product.location || '',
      lastUpdated: product.lastUpdated || product.updatedAt || product.createdAt,
    }));

    return NextResponse.json({ products: mapped });
  } catch (error) {
    console.error('[WMS] GET /wms/products error', error);
    return NextResponse.json(
      { error: 'Unable to load products' },
      { status: 500 }
    );
  }
}
