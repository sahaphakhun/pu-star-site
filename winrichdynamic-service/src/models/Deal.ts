import mongoose, { Schema, Document, Model } from 'mongoose';

export type DealStatus = 'open' | 'won' | 'lost';
export type DealApprovalStatus = 'none' | 'pending' | 'approved' | 'rejected';

export interface IDeal extends Document {
  title: string;
  customerId?: string; // อ้างอิง Customer._id (optional at creation)
  customerName?: string;
  amount: number; // มูลค่าดีล (รวม VAT หรือไม่ ปล่อยให้ business ตีความ แต่เก็บเป็นตัวเลข)
  currency?: string; // THB เป็นต้น
  stageId: string; // อ้างอิง PipelineStage._id
  stageName?: string; // denormalized เพื่อ query เร็ว
  ownerId?: string; // adminId จาก token
  team?: string; // ทีม/โซน
  expectedCloseDate?: Date;
  status: DealStatus;
  approvalStatus?: DealApprovalStatus;
  probability?: number; // override จาก stage ได้
  tags?: string[];
  description?: string;
  quotationIds?: string[]; // อ้างอิงหลายใบเสนอราคา
  lastActivityAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const dealSchema = new Schema<IDeal>(
  {
    title: {
      type: String,
      required: [true, 'กรุณาระบุชื่่อดีล'],
      trim: true,
      maxlength: [200, 'ชื่อดีลต้องไม่เกิน 200 ตัวอักษร'],
    },
    customerId: {
      type: String,
      required: [true, 'กรุณาระบุลูกค้า'],
      index: true,
      trim: true,
    },
    customerName: {
      type: String,
      trim: true,
      maxlength: [200, 'ชื่อลูกค้าต้องไม่เกิน 200 ตัวอักษร'],
    },
    amount: {
      type: Number,
      required: [true, 'กรุณาระบุมูลค่าดีล'],
      min: [0, 'มูลค่าดีลต้องไม่ต่ำกว่า 0'],
    },
    currency: {
      type: String,
      trim: true,
      default: 'THB',
    },
    stageId: {
      type: String,
      required: [true, 'กรุณาระบุสเตจ'],
      index: true,
      trim: true,
    },
    stageName: {
      type: String,
      trim: true,
    },
    ownerId: {
      type: String,
      index: true,
      trim: true,
    },
    team: {
      type: String,
      index: true,
      trim: true,
    },
    expectedCloseDate: {
      type: Date,
    },
    status: {
      type: String,
      enum: ['open', 'won', 'lost'],
      default: 'open',
      index: true,
    },
    approvalStatus: {
      type: String,
      enum: ['none', 'pending', 'approved', 'rejected'],
      default: 'none',
      index: true,
    },
    probability: {
      type: Number,
      min: [0, 'ความน่าจะเป็นต้องไม่ต่ำกว่า 0'],
      max: [100, 'ความน่าจะเป็นต้องไม่เกิน 100'],
    },
    tags: {
      type: [String],
      default: [],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [2000, 'รายละเอียดต้องไม่เกิน 2000 ตัวอักษร'],
    },
    quotationIds: {
      type: [String],
      default: [],
    },
    lastActivityAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

dealSchema.index({ title: 'text', customerName: 'text', tags: 'text' });
dealSchema.index({ createdAt: -1 });
dealSchema.index({ updatedAt: -1 });
dealSchema.index({ stageId: 1, ownerId: 1 });

const DealModel: Model<IDeal> =
  (mongoose.models.Deal as Model<IDeal>) ||
  mongoose.model<IDeal>('Deal', dealSchema);

export default DealModel;


