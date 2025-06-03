import mongoose, { Schema, Document } from 'mongoose';

export interface IProduct extends Document {
  name: string;
  price: number;
  description: string;
  imageUrl: string;
  category?: string;
  options?: {
    name: string;
    values: {
      label: string;
      imageUrl?: string;
    }[];
  }[];
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
      required: [true, 'กรุณาระบุราคาสินค้า'],
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
  },
  { 
    timestamps: true 
  }
);

export default mongoose.models.Product || mongoose.model<IProduct>('Product', productSchema); 