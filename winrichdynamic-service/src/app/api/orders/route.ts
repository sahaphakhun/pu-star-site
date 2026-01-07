import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Order from '@/models/Order';
import { sendSlipVerificationRequest } from '@/app/notification/paymentNotifications';
import { generateQuotationFromOrder } from '@/services/quotationGenerator';

export async function POST(request: NextRequest) {
	try {
		await connectDB();
		const body = await request.json();
		const {
			customerName,
			customerPhone,
			items,
			shippingFee = 0,
			discount = 0,
			paymentMethod = 'cod',
			creditPaymentDueDate,
			orderType = 'online'
		} = body;

		if (!customerName || !customerPhone || !Array.isArray(items) || items.length === 0) {
			return NextResponse.json({ error: 'ข้อมูลไม่ครบถ้วน' }, { status: 400 });
		}

		const normalizedItems = items.map((item: any) => {
			const quantity = Number(item.quantity || 0);
			const unitPrice = Number(item.unitPrice ?? item.price ?? item.pricePerUnit ?? 0);
			const discountPerUnit = Number(item.discount ?? item.discountPerUnit ?? 0);
			const amount = Number(item.amount ?? (unitPrice - discountPerUnit) * quantity);
			const name = item.name || item.productName || item.description || '';

			return {
				productId: item.productId || undefined,
				name: name || 'ไม่ระบุ',
				description: item.description || undefined,
				price: unitPrice,
				quantity,
				discount: discountPerUnit,
				amount,
				sku: item.sku || undefined,
				unitLabel: item.unitLabel || item.unit || undefined,
				unitPrice,
				selectedOptions: item.selectedOptions || undefined,
			};
		});

		const itemsTotal = normalizedItems.reduce(
			(sum: number, it: any) => sum + Number(it.price || 0) * Number(it.quantity || 0),
			0
		);
		const subtotal = normalizedItems.reduce(
			(sum: number, it: any) => sum + Number(it.amount ?? (it.price || 0) * (it.quantity || 0)),
			0
		);
		const vatRate = Number(body.vatRate ?? body.vat ?? 0);
		const vatAmount = Number(body.vatAmount ?? (vatRate ? (subtotal * vatRate) / 100 : 0));
		const isSalesOrder = orderType === 'sales_order';
		const computedTotalAmount = isSalesOrder
			? subtotal + vatAmount + Number(shippingFee || 0) - Number(discount || 0)
			: itemsTotal;
		const totalAmount = Number(body.totalAmount ?? body.total ?? computedTotalAmount);
		
		// สร้างข้อมูลออเดอร์
		const orderData: any = {
			customerName,
			customerPhone,
			items: normalizedItems,
			shippingFee: Number(shippingFee || 0),
			discount: Number(discount || 0),
			subtotal: Number(body.subtotal ?? subtotal),
			vatRate: Number.isFinite(vatRate) ? vatRate : undefined,
			vatAmount: Number(body.vatAmount ?? vatAmount),
			totalAmount,
			paymentMethod,
			orderType,
			status: body.status || undefined,
			salesOrderNumber: body.salesOrderNumber || undefined,
			quotationId: body.quotationId || undefined,
			customerId: body.customerId || undefined,
			contactName: body.contactName || undefined,
			contactEmail: body.contactEmail || undefined,
			contactPhone: body.contactPhone || undefined,
			importance: body.importance !== undefined ? Number(body.importance) : undefined,
			ownerId: body.ownerId || undefined,
			team: body.team || undefined,
			deliveryStatus: body.deliveryStatus || undefined,
			deliveryMethod: body.deliveryMethod || undefined,
			trackingNumber: body.trackingNumber || undefined,
			deliveryAddress: body.deliveryAddress || undefined,
			deliveryProvince: body.deliveryProvince || undefined,
			deliveryDistrict: body.deliveryDistrict || undefined,
			deliverySubdistrict: body.deliverySubdistrict || undefined,
			deliveryPostalCode: body.deliveryPostalCode || undefined,
			paymentStatus: body.paymentStatus || undefined,
			paidAmount: body.paidAmount !== undefined ? Number(body.paidAmount) : undefined,
			remainingAmount: body.remainingAmount !== undefined ? Number(body.remainingAmount) : undefined,
			paymentTerms: body.paymentTerms || undefined,
			notes: body.notes || undefined,
			internalNotes: body.internalNotes || undefined,
		};

		if (orderData.paidAmount !== undefined && orderData.remainingAmount === undefined) {
			orderData.remainingAmount = Math.max(totalAmount - Number(orderData.paidAmount || 0), 0);
		}
		if (!orderData.paymentStatus && orderData.paidAmount !== undefined) {
			const paidAmount = Number(orderData.paidAmount || 0);
			orderData.paymentStatus =
				paidAmount <= 0 ? 'unpaid' : paidAmount >= totalAmount ? 'paid' : 'partial';
		}

		const parseDate = (value?: string) => {
			if (!value) return undefined;
			const date = new Date(value);
			return Number.isNaN(date.getTime()) ? undefined : date;
		};

		const orderDate = parseDate(body.orderDate);
		if (orderDate) {
			orderData.orderDate = orderDate;
		}
		const deliveryDate = parseDate(body.deliveryDate);
		if (deliveryDate) {
			orderData.deliveryDate = deliveryDate;
		}
		const paymentDueDate = parseDate(body.paymentDueDate);
		if (paymentDueDate) {
			orderData.paymentDueDate = paymentDueDate;
		}

		// ถ้าเป็นการชำระเงินแบบ COD ให้กำหนดสถานะ (เฉพาะออเดอร์ออนไลน์)
		if (!isSalesOrder && paymentMethod === 'cod') {
			orderData.codPaymentStatus = 'pending';
			orderData.paymentConfirmationRequired = true;
		}

		// ถ้าเป็นการชำระเงินแบบเครดิต ให้กำหนดวันที่ครบกำหนด (เฉพาะออเดอร์ออนไลน์)
		if (!isSalesOrder && paymentMethod === 'credit') {
			const creditDueDate = parseDate(creditPaymentDueDate);
			if (creditDueDate) {
				orderData.creditPaymentDueDate = creditDueDate;
			}
		}

		const order = await Order.create(orderData);

		// Generate quotation automatically for every online order
		let quotationData = null;
		if (!isSalesOrder) try {
			const quotation = await generateQuotationFromOrder(order._id.toString(), {
				autoConvertToSalesOrder: false, // Default to manual conversion
				requireAdminApproval: true,
				conversionDelay: 0,
				customValidityDays: 7
			});

			quotationData = {
				id: quotation._id,
				number: quotation.quotationNumber,
				status: quotation.status,
				autoGenerated: quotation.autoGenerated,
				validUntil: quotation.validUntil
			};

			console.log(`Automatically generated quotation ${quotation.quotationNumber} for order ${order._id}`);
		} catch (quotationError) {
			console.error('Error generating automatic quotation:', quotationError);
			// Don't fail the order creation if quotation generation fails
		}

		// ถ้าเป็นการโอนเงิน ให้ส่งการแจ้งเตือนขออัพโหลดสลิป (เฉพาะออเดอร์ออนไลน์)
		if (!isSalesOrder && paymentMethod === 'transfer') {
			try {
				await sendSlipVerificationRequest(order._id.toString());
			} catch (notificationError) {
				console.error('Error sending slip verification request:', notificationError);
			}
		}

		// Return order with quotation information if generated
		const response: any = { order, data: order };
		if (quotationData) {
			response.quotation = quotationData;
		}

		return NextResponse.json(response, { status: 201 });
	} catch (error) {
		console.error('[B2B] Error creating order:', error);
		return NextResponse.json({ error: 'เกิดข้อผิดพลาดในการสร้างคำสั่งซื้อ' }, { status: 500 });
	}
}

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const page = Math.max(Number(searchParams.get('page') || '1'), 1);
    const limit = Math.min(Math.max(Number(searchParams.get('limit') || '20'), 1), 100);
    const q = searchParams.get('q')?.trim();
    const statusParam = searchParams.get('status')?.trim();
    const orderType = searchParams.get('orderType')?.trim();
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');
    const customerId = searchParams.get('customerId');
    const customerPhone = searchParams.get('customerPhone');
    const ownerId = searchParams.get('ownerId');
    const paymentMethod = searchParams.get('paymentMethod');
    const paymentStatus = searchParams.get('paymentStatus');
    const deliveryStatus = searchParams.get('deliveryStatus');

    const filter: Record<string, any> = {};

    if (orderType) {
      filter.orderType = orderType;
    }
    if (customerId) {
      filter.customerId = customerId;
    }
    if (customerPhone) {
      filter.customerPhone = { $regex: customerPhone, $options: 'i' };
    }
    if (ownerId) {
      filter.ownerId = ownerId;
    }
    if (paymentMethod) {
      filter.paymentMethod = paymentMethod;
    }
    if (paymentStatus) {
      filter.paymentStatus = paymentStatus;
    }
    if (deliveryStatus) {
      filter.deliveryStatus = deliveryStatus;
    }

    if (statusParam) {
      const statuses = statusParam
        .split(',')
        .map((status) => status.trim())
        .filter(Boolean);
      if (statuses.length === 1) {
        filter.status = statuses[0];
      } else if (statuses.length > 1) {
        filter.status = { $in: statuses };
      }
    }

    if (dateFrom || dateTo) {
      const orderDate: Record<string, Date> = {};
      if (dateFrom) {
        const parsedFrom = new Date(dateFrom);
        if (!Number.isNaN(parsedFrom.getTime())) {
          orderDate.$gte = parsedFrom;
        }
      }
      if (dateTo) {
        const parsedTo = new Date(dateTo);
        if (!Number.isNaN(parsedTo.getTime())) {
          orderDate.$lte = parsedTo;
        }
      }
      if (Object.keys(orderDate).length > 0) {
        filter.orderDate = orderDate;
      }
    }

    if (q) {
      const regex = new RegExp(q, 'i');
      filter.$or = [
        { customerName: regex },
        { customerPhone: regex },
        { salesOrderNumber: regex },
        { trackingNumber: regex },
        { quotationId: regex },
      ];
    }

    const hasSearchParams = searchParams.toString().length > 0;
    if (!hasSearchParams) {
      const orders = await Order.find({}).sort({ createdAt: -1 });
      return NextResponse.json(orders);
    }

    const total = await Order.countDocuments(filter);
    const orders = await Order.find(filter)
      .sort({ orderDate: -1, createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    return NextResponse.json({
      data: orders,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error('[B2B] Error fetching orders:', error);
    return NextResponse.json({ error: 'เกิดข้อผิดพลาดในการดึงคำสั่งซื้อ' }, { status: 500 });
  }
}
