import mongoose, { Schema, Document } from 'mongoose';

export interface IOrderItem {
  productId: Schema.Types.ObjectId;
  name: string;
  price: number;
  quantity: number;
  selectedOptions?: Record<string, string>;
  unitLabel?: string;
  unitPrice?: number;
}

export interface IPackingProof {
  url: string;
  type: 'image' | 'video';
  addedAt: Date;
}

export interface ITaxInvoice {
  requestTaxInvoice: boolean;
  companyName?: string;
  taxId?: string;
  companyAddress?: string;
  companyPhone?: string;
  companyEmail?: string;
}

export interface IClaimInfo {
  claimDate: Date;
  claimReason: string;
  claimImages: string[];
  claimStatus: 'pending' | 'approved' | 'rejected';
  adminResponse?: string;
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
  status: 'pending' | 'confirmed' | 'ready' | 'shipped' | 'delivered' | 'cancelled' | 'claimed';
  trackingNumber?: string;
  shippingProvider?: string;
  trackingSent?: boolean;
  packingProofs?: IPackingProof[];
  taxInvoice?: ITaxInvoice;
  claimInfo?: IClaimInfo;
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
  },
  unitLabel: {
    type: String
  },
  unitPrice: {
    type: Number
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
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'ready', 'shipped', 'delivered', 'cancelled', 'claimed'],
      default: 'pending'
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    trackingNumber: {
      type: String
    },
    shippingProvider: {
      type: String
    },
    trackingSent: {
      type: Boolean,
      default: false
    },
    packingProofs: {
      type: [
        {
          url: { type: String, required: true },
          type: { type: String, enum: ['image', 'video'], default: 'image' },
          addedAt: { type: Date, default: Date.now }
        }
      ],
      default: []
    },
    taxInvoice: {
      requestTaxInvoice: { type: Boolean, default: false },
      companyName: { type: String },
      taxId: { type: String },
      companyAddress: { type: String },
      companyPhone: { type: String },
      companyEmail: { type: String }
    },
    claimInfo: {
      claimDate: { type: Date },
      claimReason: { type: String },
      claimImages: { type: [String], default: [] },
      claimStatus: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
      adminResponse: { type: String }
    }
  },
  { 
    timestamps: true 
  }
);

// เพิ่มดัชนีสำหรับการค้นหาและเรียงลำดับ
orderSchema.index({ orderDate: -1 });
orderSchema.index({ customerPhone: 1 });

export default mongoose.models.Order || mongoose.model<IOrder>('Order', orderSchema); 