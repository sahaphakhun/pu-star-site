import mongoose, { Schema, Document } from 'mongoose';

export interface ICategory extends Document {
  name: string;
  slug?: string;
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
    slug: {
      type: String,
      required: false,
      trim: true,
      lowercase: true,
      index: true,
    },
  },
  { timestamps: true }
);

categorySchema.index({ name: 1 }, { unique: true });
categorySchema.index({ createdAt: -1 });

export default mongoose.models.Category || mongoose.model<ICategory>('Category', categorySchema);


