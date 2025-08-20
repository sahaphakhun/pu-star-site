import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Order from '@/models/Order';

export async function POST(request: NextRequest) {
	try {
		await connectDB();
		const body = await request.json();
		const { customerName, customerPhone, items, shippingFee = 0, discount = 0, paymentMethod = 'cod' } = body;

		if (!customerName || !customerPhone || !Array.isArray(items) || items.length === 0) {
			return NextResponse.json({ error: 'ข้อมูลไม่ครบถ้วน' }, { status: 400 });
		}

		const totalAmount = items.reduce((sum: number, it: any) => sum + (it.price || 0) * (it.quantity || 0), 0);
		const order = await Order.create({
			customerName,
			customerPhone,
			items,
			shippingFee,
			discount,
			totalAmount,
			paymentMethod,
		});

		return NextResponse.json(order, { status: 201 });
	} catch (error) {
		console.error('[B2B] Error creating order:', error);
		return NextResponse.json({ error: 'เกิดข้อผิดพลาดในการสร้างคำสั่งซื้อ' }, { status: 500 });
	}
}


