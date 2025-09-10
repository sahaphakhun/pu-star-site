import mongoose, { Schema, Document, Model } from 'mongoose';

export type ActivityType = 'call' | 'meeting' | 'email' | 'task';
export type ActivityStatus = 'planned' | 'done' | 'cancelled' | 'postponed';

export interface IActivity extends Document {
  type: ActivityType;
  subject: string;
  notes?: string;
  customerId?: string;
  dealId?: string;
  quotationId?: string;
  ownerId?: string; // ผู้สร้าง/ผู้รับผิดชอบ
  scheduledAt?: Date; // วันเวลานัดหมาย
  remindBeforeMinutes?: number; // เตือนล่วงหน้าเป็นนาที
  status: ActivityStatus;
  postponeReason?: string;
  cancelReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

const activitySchema = new Schema<IActivity>(
  {
    type: {
      type: String,
      enum: ['call', 'meeting', 'email', 'task'],
      required: true,
      index: true,
    },
    subject: {
      type: String,
      required: [true, 'กรุณาระบุหัวข้อกิจกรรม'],
      trim: true,
      maxlength: [200, 'หัวข้อกิจกรรมต้องไม่เกิน 200 ตัวอักษร'],
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [2000, 'โน้ตต้องไม่เกิน 2000 ตัวอักษร'],
    },
    customerId: {
      type: String,
      index: true,
      trim: true,
    },
    dealId: {
      type: String,
      index: true,
      trim: true,
    },
    quotationId: {
      type: String,
      index: true,
      trim: true,
    },
    ownerId: {
      type: String,
      index: true,
      trim: true,
    },
    scheduledAt: {
      type: Date,
      index: true,
    },
    remindBeforeMinutes: {
      type: Number,
      min: [0, 'เวลาล่วงหน้าต้องไม่ต่ำกว่า 0 นาที'],
      default: 0,
    },
    status: {
      type: String,
      enum: ['planned', 'done', 'cancelled', 'postponed'],
      default: 'planned',
      index: true,
    },
    postponeReason: {
      type: String,
      trim: true,
      maxlength: [500, 'เหตุผลต้องไม่เกิน 500 ตัวอักษร'],
    },
    cancelReason: {
      type: String,
      trim: true,
      maxlength: [500, 'เหตุผลต้องไม่เกิน 500 ตัวอักษร'],
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

activitySchema.index({ createdAt: -1 });
activitySchema.index({ customerId: 1, scheduledAt: -1 });
activitySchema.index({ dealId: 1, scheduledAt: -1 });
activitySchema.index({ quotationId: 1, scheduledAt: -1 });

const ActivityModel: Model<IActivity> =
  (mongoose.models.Activity as Model<IActivity>) ||
  mongoose.model<IActivity>('Activity', activitySchema);

export default ActivityModel;


