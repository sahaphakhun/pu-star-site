import mongoose, { Schema, Document } from 'mongoose';

export interface IOrderItem {
  productId: Schema.Types.ObjectId;
  name: string;
  price: number;
  quantity: number;
  selectedOptions?: Record<string, string>;
}

export interface IOrder extends Document {
  customerName: string;
  customerPhone: string;
  items: IOrderItem[];
  totalAmount: number;
  shippingFee: number;
  discount?: number;
  orderDate: Date;
  createdAt: Date;
  updatedAt: Date;
  customerAddress?: string;
  paymentMethod?: 'cod' | 'transfer';
  slipUrl?: string;
  userId?: Schema.Types.ObjectId;
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
  },
  selectedOptions: {
    type: Schema.Types.Mixed,
    default: {}
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
    shippingFee: {
      type: Number,
      required: true,
      default: 0
    },
    discount: {
      type: Number,
      default: 0
    },
    orderDate: {
      type: Date,
      default: Date.now
    },
    customerAddress: {
      type: String,
      default: ''
    },
    paymentMethod: {
      type: String,
      enum: ['cod', 'transfer'],
      default: 'cod'
    },
    slipUrl: {
      type: String,
      default: ''
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    }
  },
  { 
    timestamps: true 
  }
);

export default mongoose.models.Order || mongoose.model<IOrder>('Order', orderSchema); 