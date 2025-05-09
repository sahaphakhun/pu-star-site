import mongoose, { Schema, Document } from 'mongoose';

export interface IOrderItem {
  productId: Schema.Types.ObjectId;
  name: string;
  price: number;
  quantity: number;
}

export interface IOrder extends Document {
  customerName: string;
  customerPhone: string;
  items: IOrderItem[];
  totalAmount: number;
  orderDate: Date;
  createdAt: Date;
  updatedAt: Date;
}

const orderItemSchema = new Schema<IOrderItem>({
  productId: {
    type: Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  name: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  }
});

const orderSchema = new Schema<IOrder>(
  {
    customerName: {
      type: String,
      required: [true, 'กรุณาระบุชื่อลูกค้า'],
      trim: true,
    },
    customerPhone: {
      type: String,
      required: [true, 'กรุณาระบุเบอร์โทรลูกค้า'],
      trim: true,
    },
    items: [orderItemSchema],
    totalAmount: {
      type: Number,
      required: true
    },
    orderDate: {
      type: Date,
      default: Date.now
    }
  },
  { 
    timestamps: true 
  }
);

export default mongoose.models.Order || mongoose.model<IOrder>('Order', orderSchema); 