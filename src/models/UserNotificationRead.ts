import mongoose, { Schema, Document } from 'mongoose';

export interface IUserNotificationRead extends Document {
  userId: Schema.Types.ObjectId;
  eventId: string; // รูปแบบเดียวกับฝั่ง UI เช่น "order:<id>:<status>:<ts>"
  category?: 'orders' | 'quotes';
  sourceId?: string; // อ้างอิง orderId หรือ quoteId เผื่อใช้ในอนาคต
  readAt: Date;
}

const userNotificationReadSchema = new Schema<IUserNotificationRead>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    eventId: { type: String, required: true },
    category: { type: String, enum: ['orders', 'quotes'], required: false },
    sourceId: { type: String, required: false },
    readAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// ป้องกันซ้ำต่อผู้ใช้-อีเวนต์เดียวกัน
userNotificationReadSchema.index({ userId: 1, eventId: 1 }, { unique: true });
userNotificationReadSchema.index({ category: 1 });

export default mongoose.models.UserNotificationRead ||
  mongoose.model<IUserNotificationRead>('UserNotificationRead', userNotificationReadSchema);


