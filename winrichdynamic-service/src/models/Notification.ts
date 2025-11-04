import mongoose, { Schema, Document, Model } from 'mongoose';

export type NotificationType = 
  | 'payment_cod_reminder'
  | 'payment_credit_due'
  | 'payment_status_change'
  | 'payment_slip_request'
  | 'order_status_update'
  | 'quotation_status'
  | 'sales_order_status'
  | 'system_alert'
  | 'customer_update'
  | 'product_update';

export interface INotification extends Document {
  id: string;
  userId?: string;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  data?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
  expiresAt?: Date;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  actionUrl?: string;
  actionText?: string;
}

export interface NotificationModel extends Model<INotification> {
  createNotification(notificationData: Partial<INotification>): Promise<INotification>;
  getUnreadCount(userId?: string): Promise<number>;
  markAsRead(notificationIds: string[]): Promise<any>;
  markAllAsRead(userId?: string): Promise<any>;
  clearOldNotifications(daysOld?: number): Promise<any>;
}

const notificationSchema = new Schema<INotification>(
  {
    userId: { type: String, index: true },
    type: { 
      type: String, 
      enum: [
        'payment_cod_reminder',
        'payment_credit_due', 
        'payment_status_change',
        'payment_slip_request',
        'order_status_update',
        'quotation_status',
        'sales_order_status',
        'system_alert',
        'customer_update',
        'product_update'
      ],
      required: true,
      index: true
    },
    title: { type: String, required: true, trim: true },
    message: { type: String, required: true, trim: true },
    isRead: { type: Boolean, default: false, index: true },
    data: { type: Schema.Types.Mixed, default: {} },
    expiresAt: { type: Date },
    priority: { 
      type: String, 
      enum: ['low', 'medium', 'high', 'urgent'], 
      default: 'medium',
      index: true
    },
    actionUrl: { type: String },
    actionText: { type: String }
  },
  { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Virtual for id
notificationSchema.virtual('id').get(function(this: any) {
  return this._id.toHexString();
});

// Indexes for better query performance
notificationSchema.index({ createdAt: -1 });
notificationSchema.index({ userId: 1, isRead: 1 });
notificationSchema.index({ userId: 1, createdAt: -1 });
notificationSchema.index({ type: 1, isRead: 1 });

// TTL index to automatically delete expired notifications
notificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Static method to create notification with default values
notificationSchema.statics.createNotification = function(notificationData: Partial<INotification>) {
  const notification = new this({
    ...notificationData,
    isRead: false,
    createdAt: new Date(),
    updatedAt: new Date()
  });
  
  // Set default expiration if not provided (30 days)
  if (!notification.expiresAt) {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);
    notification.expiresAt = expiresAt;
  }
  
  return notification.save();
};

// Static method to get unread count
notificationSchema.statics.getUnreadCount = function(userId?: string) {
  const query: any = { isRead: false };
  if (userId) {
    query.userId = userId;
  }
  return this.countDocuments(query);
};

// Static method to mark notifications as read
notificationSchema.statics.markAsRead = function(notificationIds: string[]) {
  return this.updateMany(
    { _id: { $in: notificationIds } },
    { isRead: true, updatedAt: new Date() }
  );
};

// Static method to mark all notifications as read for a user
notificationSchema.statics.markAllAsRead = function(userId?: string) {
  const query: any = { isRead: false };
  if (userId) {
    query.userId = userId;
  }
  return this.updateMany(
    query,
    { isRead: true, updatedAt: new Date() }
  );
};

// Static method to clear old notifications
notificationSchema.statics.clearOldNotifications = function(daysOld = 30) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysOld);
  
  return this.deleteMany({
    createdAt: { $lt: cutoffDate }
  });
};

const Notification =
  (mongoose.models.Notification as NotificationModel) ||
  mongoose.model<INotification, NotificationModel>('Notification', notificationSchema);

export default Notification;
