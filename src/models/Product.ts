import mongoose, { Schema, Document } from 'mongoose';

export interface IProduct extends Document {
  name: string;
  price: number;
  description: string;
  imageUrl: string;
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
  },
  { 
    timestamps: true 
  }
);

export default mongoose.models.Product || mongoose.model<IProduct>('Product', productSchema); 