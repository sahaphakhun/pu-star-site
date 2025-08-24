import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Product from '@/models/Product';
import { verifyToken } from '@/lib/auth';

export async function GET(request: NextRequest) {
	try {
		await connectDB();
		const { searchParams } = new URL(request.url);
		const category = searchParams.get('category');
		const search = searchParams.get('search');

		const query: any = {};
		if (category && category !== 'all') {
			query.category = category;
		}
		if (search) {
			query.$text = { $search: search };
		}

		const products = await Product.find(query).sort({ createdAt: -1 });
		return NextResponse.json({ 
			success: true, 
			data: products,
			message: 'ดึงข้อมูลสินค้าเรียบร้อยแล้ว'
		});
	} catch (error) {
		console.error('[B2B] Error fetching products:', error);
		return NextResponse.json({ 
			success: false,
			error: 'เกิดข้อผิดพลาดในการดึงข้อมูลสินค้า' 
		}, { status: 500 });
	}
}

export async function POST(request: NextRequest) {
	try {
		const auth = verifyToken(request);
		if (!auth.valid) {
			console.log('[B2B] Auth failed:', auth.error);
			return NextResponse.json({ 
				success: false,
				error: 'Unauthorized - กรุณาเข้าสู่ระบบใหม่' 
			}, { status: 401 });
		}

		console.log('[B2B] Auth successful for admin:', auth.adminId);

		await connectDB();
		const body = await request.json();
		const { name, price, description, imageUrl, units, category, options, isAvailable } = body;

		if (!name || !description || !imageUrl) {
			return NextResponse.json({ 
				success: false,
				error: 'กรุณากรอกข้อมูลให้ครบถ้วน' 
			}, { status: 400 });
		}
		if (price === undefined && (!units || units.length === 0)) {
			return NextResponse.json({ 
				success: false,
				error: 'กรุณาระบุราคาเดี่ยว หรือ เพิ่มหน่วยอย่างน้อย 1 หน่วย' 
			}, { status: 400 });
		}

		const product = await Product.create({
			name,
			price,
			description,
			imageUrl,
			units,
			category: category || 'ทั่วไป',
			options,
			isAvailable: isAvailable !== false,
			createdBy: auth.adminId, // เพิ่มข้อมูลผู้สร้าง
			createdAt: new Date(),
			updatedAt: new Date()
		});

		console.log('[B2B] Product created successfully:', product._id);

		return NextResponse.json({ 
			success: true, 
			data: product,
			message: 'สร้างสินค้าเรียบร้อยแล้ว'
		}, { status: 201 });
	} catch (error) {
		console.error('[B2B] Error creating product:', error);
		return NextResponse.json({ 
			success: false,
			error: 'เกิดข้อผิดพลาดในการสร้างสินค้า' 
		}, { status: 500 });
	}
}


