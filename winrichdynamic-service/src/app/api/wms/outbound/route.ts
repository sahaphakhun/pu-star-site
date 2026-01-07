import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Order from '@/models/Order';
import Admin from '@/models/Admin';

const toNumber = (value: unknown, fallback = 0) => {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
};

const resolvePriority = (importance?: number) => {
  const imp = importance ?? 0;
  if (imp >= 5) return 'urgent';
  if (imp === 4) return 'high';
  if (imp === 3) return 'medium';
  return 'low';
};

const resolveStatus = (order: any) => {
  if (order.deliveryStatus) {
    const map: Record<string, string> = {
      pending: 'pending',
      preparing: 'picking',
      shipped: 'shipped',
      delivered: 'delivered',
    };
    return map[order.deliveryStatus] || 'pending';
  }
  const map: Record<string, string> = {
    pending: 'pending',
    confirmed: 'picking',
    ready: 'packing',
    shipped: 'shipped',
    delivered: 'delivered',
    cancelled: 'cancelled',
  };
  return map[order.status] || 'pending';
};

const resolveTaskStatus = (status: string) => {
  if (status === 'cancelled') return 'cancelled';
  if (status === 'picking') return 'in_progress';
  if (status === 'packing' || status === 'shipped' || status === 'delivered') return 'completed';
  return 'pending';
};

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const url = new URL(request.url);
    const orderTypeParam = url.searchParams.get('orderType');
    const match: Record<string, any> = {};
    if (orderTypeParam) match.orderType = orderTypeParam;

    const orders = await Order.find(match).sort({ orderDate: -1 }).limit(200).lean();
    const ownerIds = orders.map((order: any) => order.ownerId).filter(Boolean);
    const admins = ownerIds.length
      ? await Admin.find({ _id: { $in: ownerIds } }).select('name').lean()
      : [];
    const adminMap = new Map(admins.map((admin: any) => [String(admin._id), admin.name]));

    const salesOrders = orders.map((order: any) => {
      const items = Array.isArray(order.items) ? order.items : [];
      const totalItems = items.reduce((sum: number, item: any) => sum + toNumber(item.quantity, 0), 0);
      const status = resolveStatus(order);
      const pickedItems = ['packing', 'shipped', 'delivered'].includes(status) ? totalItems : 0;
      return {
        id: String(order._id),
        orderNumber: order.salesOrderNumber || String(order._id).slice(-6),
        customer: order.customerName || 'Unknown',
        orderDate: order.orderDate || order.createdAt,
        expectedDelivery: order.deliveryDate || order.orderDate || order.createdAt,
        status,
        priority: resolvePriority(toNumber(order.importance, 3)),
        totalItems,
        pickedItems,
        totalValue: toNumber(order.totalAmount, 0),
        shippingMethod: order.deliveryMethod || order.shippingProvider || 'Standard',
      };
    });

    const pickingTasks = orders.map((order: any) => {
      const items = Array.isArray(order.items) ? order.items : [];
      const totalItems = items.reduce((sum: number, item: any) => sum + toNumber(item.quantity, 0), 0);
      const status = resolveStatus(order);
      const taskStatus = resolveTaskStatus(status);
      return {
        id: String(order._id),
        taskNumber: `PT-${order.salesOrderNumber || String(order._id).slice(-6)}`,
        orderNumber: order.salesOrderNumber || String(order._id).slice(-6),
        picker: adminMap.get(String(order.ownerId)) || '',
        status: taskStatus,
        priority: resolvePriority(toNumber(order.importance, 3)),
        items: items.map((item: any) => ({
          productId: String(item.productId || ''),
          productName: item.name,
          sku: item.sku || '',
          location: '',
          requiredQty: toNumber(item.quantity, 0),
          pickedQty: taskStatus === 'completed' ? toNumber(item.quantity, 0) : 0,
          unit: item.unitLabel || 'pcs',
        })),
        startTime: order.createdAt,
        completedTime: taskStatus === 'completed' ? order.updatedAt : undefined,
        estimatedDuration: totalItems * 5,
      };
    });

    return NextResponse.json({ salesOrders, pickingTasks });
  } catch (error) {
    console.error('[WMS] GET /wms/outbound error', error);
    return NextResponse.json(
      { error: 'Unable to load outbound data' },
      { status: 500 }
    );
  }
}
