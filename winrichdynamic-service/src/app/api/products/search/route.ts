import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Product from '@/models/Product';

/**
 * API สำหรับค้นหาสินค้าด้วย keyword
 * GET /api/products/search?q=keyword&limit=10
 */
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const query = searchParams.get('q') || '';
        const limit = parseInt(searchParams.get('limit') || '10', 10);

        if (!query || query.length < 2) {
            return NextResponse.json({ products: [] });
        }

        await connectDB();

        // Search by name, sku, or description using text search or regex
        const searchRegex = new RegExp(query, 'i');

        const products = await Product.find({
            isAvailable: true,
            isDeleted: { $ne: true },
            $or: [
                { name: searchRegex },
                { sku: searchRegex },
                { description: searchRegex },
                { 'skuVariants.sku': searchRegex },
            ],
        })
            .select('name sku price units category imageUrl description')
            .limit(limit)
            .lean();

        return NextResponse.json({ products });

    } catch (error) {
        console.error('Error searching products:', error);
        return NextResponse.json(
            { error: 'เกิดข้อผิดพลาดในการค้นหาสินค้า', products: [] },
            { status: 500 }
        );
    }
}
