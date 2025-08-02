import mongoose, { Schema, Document } from 'mongoose';

export interface ICategory extends Document {
  name: string;
  description?: string;
  isActive: boolean;
  displayOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

const categorySchema = new Schema<ICategory>(
  {
    name: {
      type: String,
      required: [true, 'กรุณาระบุชื่อหมวดหมู่'],
      trim: true,
      unique: true,
    },
    description: {
      type: String,
      trim: true,
    },
    isActive: {
      type: Boolean,
      required: false,
      default: true,
    },
    displayOrder: {
      type: Number,
      required: false,
      default: 0,
    },
  },
  { 
    timestamps: true 
  }
);

// เพิ่มดัชนีเพื่อเพิ่มประสิทธิภาพการค้นหาและการจัดเรียง
categorySchema.index({ displayOrder: 1, name: 1 });
categorySchema.index({ isActive: 1, displayOrder: 1 });

export default mongoose.models.Category || mongoose.model<ICategory>('Category', categorySchema);