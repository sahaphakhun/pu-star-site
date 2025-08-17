import mongoose, { Schema, Document } from 'mongoose';

export interface ISKUConfig extends Document {
  name: string;
  prefix: string;
  format: string;
  counter: number;
  category?: string;
  isActive: boolean;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

const skuConfigSchema = new Schema<ISKUConfig>(
  {
    name: {
      type: String,
      required: [true, 'กรุณาระบุชื่อรูปแบบ SKU'],
      trim: true,
      unique: true,
    },
    prefix: {
      type: String,
      required: [true, 'กรุณาระบุคำนำหน้า SKU'],
      trim: true,
      uppercase: true,
      maxlength: [10, 'คำนำหน้าต้องไม่เกิน 10 ตัวอักษร'],
    },
    format: {
      type: String,
      required: [true, 'กรุณาระบุรูปแบบ SKU'],
      trim: true,
      default: '{PREFIX}-{COUNTER}',
    },
    counter: {
      type: Number,
      required: true,
      min: [1, 'ตัวนับต้องไม่ต่ำกว่า 1'],
      default: 1,
    },
    category: {
      type: String,
      required: false,
      trim: true,
    },
    isActive: {
      type: Boolean,
      required: false,
      default: true,
    },
    description: {
      type: String,
      trim: true,
    },
  },
  { 
    timestamps: true 
  }
);

// เพิ่มดัชนีเพื่อเพิ่มประสิทธิภาพ
skuConfigSchema.index({ category: 1, isActive: 1 });
skuConfigSchema.index({ prefix: 1 }, { unique: true });

export default mongoose.models.SKUConfig || mongoose.model<ISKUConfig>('SKUConfig', skuConfigSchema);
