import connectDB from '@/lib/mongodb';
import Notification, { INotification, NotificationType } from '@/models/Notification';
import Order from '@/models/Order';

/**
 * Create a new notification
 */
export async function createNotification(data: {
  userId?: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, any>;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  actionUrl?: string;
  actionText?: string;
  expiresAt?: Date;
}): Promise<INotification> {
  try {
    await connectDB();
    const notification = await Notification.createNotification(data);
    return notification;
  } catch (error) {
    console.error('Error creating notification:', error);
    throw error;
  }
}

/**
 * Get notifications for a user with pagination
 */
export async function getNotifications({
  userId,
  page = 1,
  limit = 20,
  type,
  isRead,
  priority
}: {
  userId?: string;
  page?: number;
  limit?: number;
  type?: NotificationType;
  isRead?: boolean;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
}): Promise<{
  notifications: INotification[];
  total: number;
  unreadCount: number;
  page: number;
  totalPages: number;
}> {
  try {
    await connectDB();
    
    const query: any = {};
    if (userId) query.userId = userId;
    if (type) query.type = type;
    if (typeof isRead === 'boolean') query.isRead = isRead;
    if (priority) query.priority = priority;
    
    const skip = (page - 1) * limit;
    
    const [notifications, total, unreadCount] = await Promise.all([
      Notification.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Notification.countDocuments(query),
      Notification.getUnreadCount(userId)
    ]);
    
    return {
      notifications,
      total,
      unreadCount,
      page,
      totalPages: Math.ceil(total / limit)
    };
  } catch (error) {
    console.error('Error getting notifications:', error);
    throw error;
  }
}

/**
 * Get unread notifications count for a user
 */
export async function getUnreadCount(userId?: string): Promise<number> {
  try {
    await connectDB();
    return await Notification.getUnreadCount(userId);
  } catch (error) {
    console.error('Error getting unread count:', error);
    throw error;
  }
}

/**
 * Mark notifications as read
 */
export async function markAsRead(notificationIds: string[]): Promise<void> {
  try {
    await connectDB();
    await Notification.markAsRead(notificationIds);
  } catch (error) {
    console.error('Error marking notifications as read:', error);
    throw error;
  }
}

/**
 * Mark all notifications as read for a user
 */
export async function markAllAsRead(userId?: string): Promise<void> {
  try {
    await connectDB();
    await Notification.markAllAsRead(userId);
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    throw error;
  }
}

/**
 * Delete notifications
 */
export async function deleteNotifications(notificationIds: string[]): Promise<void> {
  try {
    await connectDB();
    await Notification.deleteMany({ _id: { $in: notificationIds } });
  } catch (error) {
    console.error('Error deleting notifications:', error);
    throw error;
  }
}

/**
 * Clear old notifications
 */
export async function clearOldNotifications(daysOld = 30): Promise<number> {
  try {
    await connectDB();
    const result = await Notification.clearOldNotifications(daysOld);
    return result.deletedCount || 0;
  } catch (error) {
    console.error('Error clearing old notifications:', error);
    throw error;
  }
}

/**
 * Create payment-related notifications
 */
export async function createPaymentNotification({
  orderId,
  type,
  userId
}: {
  orderId: string;
  type: 'cod_reminder' | 'credit_due' | 'status_change' | 'slip_request';
  userId?: string;
}): Promise<INotification | null> {
  try {
    await connectDB();
    
    const order = await Order.findById(orderId);
    if (!order) {
      console.error('Order not found:', orderId);
      return null;
    }
    
    let notificationData: any = {
      userId,
      data: { orderId: order._id, orderNumber: order._id.toString().slice(-6) }
    };
    
    switch (type) {
      case 'cod_reminder':
        notificationData = {
          ...notificationData,
          type: 'payment_cod_reminder' as NotificationType,
          title: 'แจ้งเตือนการชำระเงิน COD',
          message: `ออเดอร์ #${order._id.toString().slice(-6)} ยังไม่ได้ชำระเงิน COD กรุณาตรวจสอบและดำเนินการชำระเงิน`,
          priority: 'high' as const,
          actionUrl: `/adminb2b/orders/${order._id}`,
          actionText: 'ดูรายละเอียด'
        };
        break;
        
      case 'credit_due':
        const dueDate = new Date(order.creditPaymentDueDate!).toLocaleDateString('th-TH');
        notificationData = {
          ...notificationData,
          type: 'payment_credit_due' as NotificationType,
          title: 'แจ้งเตือนการชำระเงินเครดิต',
          message: `ออเดอร์ #${order._id.toString().slice(-6)} กำหนดชำระเงินวันที่ ${dueDate} ยอด ฿${order.totalAmount.toLocaleString()}`,
          priority: 'high' as const,
          actionUrl: `/adminb2b/orders/${order._id}`,
          actionText: 'ดูรายละเอียด'
        };
        break;
        
      case 'status_change':
        notificationData = {
          ...notificationData,
          type: 'payment_status_change' as NotificationType,
          title: 'อัพเดทสถานะการชำระเงิน',
          message: `ออเดอร์ #${order._id.toString().slice(-6)} มีการเปลี่ยนแปลงสถานะการชำระเงิน`,
          priority: 'medium' as const,
          actionUrl: `/adminb2b/orders/${order._id}`,
          actionText: 'ดูรายละเอียด'
        };
        break;
        
      case 'slip_request':
        notificationData = {
          ...notificationData,
          type: 'payment_slip_request' as NotificationType,
          title: 'ขออัพโหลดสลิปการโอนเงิน',
          message: `กรุณาอัพโหลดสลิปการโอนเงินสำหรับออเดอร์ #${order._id.toString().slice(-6)} ยอด ฿${order.totalAmount.toLocaleString()}`,
          priority: 'high' as const,
          actionUrl: `/adminb2b/orders/${order._id}`,
          actionText: 'อัพโหลดสลิป'
        };
        break;
    }
    
    return await createNotification(notificationData);
  } catch (error) {
    console.error('Error creating payment notification:', error);
    throw error;
  }
}

/**
 * Create order status notification
 */
export async function createOrderStatusNotification({
  orderId,
  status,
  userId
}: {
  orderId: string;
  status: string;
  userId?: string;
}): Promise<INotification | null> {
  try {
    await connectDB();
    
    const order = await Order.findById(orderId);
    if (!order) {
      console.error('Order not found:', orderId);
      return null;
    }
    
    const statusMessages: Record<string, string> = {
      'confirmed': 'ออเดอร์ได้รับการยืนยันแล้ว',
      'ready': 'ออเดอร์พร้อมจัดส่ง',
      'shipped': 'ออเดอร์กำลังจัดส่ง',
      'delivered': 'ออเดอร์จัดส่งเรียบร้อยแล้ว',
      'cancelled': 'ออเดอร์ถูกยกเลิก'
    };
    
    const message = statusMessages[status] || `ออเดอร์มีการเปลี่ยนแปลงสถานะเป็น ${status}`;
    
    return await createNotification({
      userId,
      type: 'order_status_update',
      title: 'อัพเดทสถานะออเดอร์',
      message: `ออเดอร์ #${order._id.toString().slice(-6)}: ${message}`,
      data: { orderId: order._id, orderNumber: order._id.toString().slice(-6), status },
      priority: status === 'cancelled' ? 'high' : 'medium',
      actionUrl: `/adminb2b/orders/${order._id}`,
      actionText: 'ดูรายละเอียด'
    });
  } catch (error) {
    console.error('Error creating order status notification:', error);
    throw error;
  }
}

/**
 * Create system notification
 */
export async function createSystemNotification({
  title,
  message,
  priority = 'medium',
  actionUrl,
  actionText,
  userId
}: {
  title: string;
  message: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  actionUrl?: string;
  actionText?: string;
  userId?: string;
}): Promise<INotification> {
  try {
    return await createNotification({
      userId,
      type: 'system_alert',
      title,
      message,
      priority,
      actionUrl,
      actionText
    });
  } catch (error) {
    console.error('Error creating system notification:', error);
    throw error;
  }
}