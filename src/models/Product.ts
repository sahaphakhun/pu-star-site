import mongoose, { Schema, Document } from 'mongoose';

export interface IProduct extends Document {
  name: string;
  price: number;
  description: string;
  imageUrl: string;
  units?: {
    label: string;
    price: number;
    multiplier?: number;
    shippingFee?: number;
  }[];
  category?: string;
  options?: {
    name: string;
    values: {
      label: string;
      imageUrl?: string;
    }[];
    shippingFee?: number;
    unitPrice?: number;
  }[];
  isAvailable?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const productSchema = new Schema<IProduct>(
  {
    name: {
      type: String,
      required: [true, 'กรุณาระบุชื่อสินค้า'],
      trim: true,
    },
    price: {
      type: Number,
      required: true,
      min: [0, 'ราคาต้องไม่ต่ำกว่า 0'],
    },
    description: {
      type: String,
      required: [true, 'กรุณาระบุรายละเอียดสินค้า'],
      trim: true,
    },
    imageUrl: {
      type: String,
      required: [true, 'กรุณาระบุรูปภาพสินค้า'],
    },
    units: {
      type: [
        {
          label: { type: String, required: true },
          price: { type: Number, required: true, min: [0, 'ราคาต้องไม่ต่ำกว่า 0'] },
          multiplier: { type: Number, required: false, min: 1, default: 1 },
          shippingFee: { type: Number, required: false, min: 0 },
        },
      ],
      required: false,
    },
    category: {
      type: String,
      required: false,
      trim: true,
      default: 'ทั่วไป',
    },
    options: {
      type: [
        {
          name: { type: String, required: true },
          values: [
            {
              label: { type: String, required: true },
              imageUrl: { type: String, required: false },
            },
          ],
        },
      ],
      required: false,
    },
    shippingFee: {
      type: Number,
      required: false,
      min: 0,
    },
    isAvailable: {
      type: Boolean,
      required: false,
      default: true,
    },
  },
  { 
    timestamps: true 
  }
);

// เพิ่มดัชนีเพื่อเพิ่มประสิทธิภาพการค้นหาและการจัดเรียง
productSchema.index({ category: 1, createdAt: -1 });
// ดัชนี full-text สำหรับค้นหาชื่อและรายละเอียดสินค้า
productSchema.index({ name: 'text', description: 'text' });

export default mongoose.models.Product || mongoose.model<IProduct>('Product', productSchema); 