import mongoose, { Schema, Document } from 'mongoose';

export interface IAdminNotification extends Document {
  type: 'new_order' | 'claim_request' | 'general';
  title: string;
  message: string;
  relatedId?: string; // เช่น orderId สำหรับเชื่อมโยงกับออเดอร์
  createdAt: Date;
  updatedAt: Date;
  readBy: Array<{
    adminId: Schema.Types.ObjectId;
    readAt: Date;
  }>;
  isGlobal: boolean; // แจ้งเตือนทั่วไปสำหรับแอดมินทุกคน
}

const adminNotificationSchema = new Schema<IAdminNotification>(
  {
    type: {
      type: String,
      enum: ['new_order', 'claim_request', 'general'],
      required: true
    },
    title: {
      type: String,
      required: [true, 'กรุณาระบุหัวข้อการแจ้งเตือน'],
      trim: true
    },
    message: {
      type: String,
      required: [true, 'กรุณาระบุข้อความแจ้งเตือน'],
      trim: true
    },
    relatedId: {
      type: String,
      default: null
    },
    readBy: [
      {
        adminId: {
          type: Schema.Types.ObjectId,
          ref: 'User',
          required: true
        },
        readAt: {
          type: Date,
          default: Date.now
        }
      }
    ],
    isGlobal: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

// เพิ่มดัชนีสำหรับการค้นหาและเรียงลำดับ
adminNotificationSchema.index({ createdAt: -1 });
adminNotificationSchema.index({ type: 1 });
adminNotificationSchema.index({ 'readBy.adminId': 1 });

export default mongoose.models.AdminNotification || mongoose.model<IAdminNotification>('AdminNotification', adminNotificationSchema); 