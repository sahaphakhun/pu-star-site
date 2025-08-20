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
	paymentMethod?: 'cod' | 'transfer';
  status?: 'pending' | 'confirmed' | 'ready' | 'shipped' | 'delivered' | 'cancelled';
  trackingNumber?: string;
  shippingProvider?: string;
  deliveryMethod?: 'standard' | 'lalamove';
  // Packing proofs
  packingProofs?: { url: string; type: 'image' | 'video'; addedAt: Date }[];
  // Tax invoice request
  taxInvoice?: {
    requestTaxInvoice: boolean;
    companyName?: string;
    taxId?: string;
    companyAddress?: string;
    companyPhone?: string;
    companyEmail?: string;
  };
  // Claim info
  claimInfo?: {
    claimDate: Date;
    claimReason: string;
    claimImages: string[];
    claimStatus: 'pending' | 'approved' | 'rejected';
    adminResponse?: string;
    responseDate?: Date;
  };
  // Slip verification (simplified)
  slipVerification?: {
    verified: boolean;
    verifiedAt?: Date;
    verificationType?: 'manual' | 'automatic';
    verifiedBy?: string;
    status?: string;
    error?: string;
  };
}

const orderItemSchema = new Schema<IOrderItem>({
	productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
	name: { type: String, required: true },
	price: { type: Number, required: true },
	quantity: { type: Number, required: true, min: 1 },
	selectedOptions: { type: Schema.Types.Mixed, default: {} },
	unitLabel: { type: String },
	unitPrice: { type: Number },
});

const orderSchema = new Schema<IOrder>(
	{
		customerName: { type: String, required: true, trim: true },
		customerPhone: { type: String, required: true, trim: true },
		items: [orderItemSchema],
		totalAmount: { type: Number, required: true },
		shippingFee: { type: Number, required: true, default: 0 },
		discount: { type: Number, default: 0 },
		orderDate: { type: Date, default: Date.now },
		paymentMethod: { type: String, enum: ['cod', 'transfer'], default: 'cod' },
    status: { type: String, enum: ['pending', 'confirmed', 'ready', 'shipped', 'delivered', 'cancelled'], default: 'pending' },
    trackingNumber: { type: String },
    shippingProvider: { type: String },
    deliveryMethod: { type: String, enum: ['standard', 'lalamove'], default: 'standard' },
    packingProofs: {
      type: [
        {
          url: { type: String, required: true },
          type: { type: String, enum: ['image', 'video'], default: 'image' },
          addedAt: { type: Date, default: Date.now },
        },
      ],
      default: [],
    },
    taxInvoice: {
      requestTaxInvoice: { type: Boolean, default: false },
      companyName: { type: String },
      taxId: { type: String },
      companyAddress: { type: String },
      companyPhone: { type: String },
      companyEmail: { type: String },
    },
    claimInfo: {
      claimDate: { type: Date },
      claimReason: { type: String },
      claimImages: { type: [String], default: [] },
      claimStatus: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
      adminResponse: { type: String },
      responseDate: { type: Date },
    },
    slipVerification: {
      verified: { type: Boolean, default: false },
      verifiedAt: { type: Date },
      verificationType: { type: String, enum: ['manual', 'automatic'] },
      verifiedBy: { type: String },
      status: { type: String },
      error: { type: String },
    },
	},
	{ timestamps: true }
);

orderSchema.index({ orderDate: -1 });
orderSchema.index({ customerPhone: 1 });

export default mongoose.models.Order || mongoose.model<IOrder>('Order', orderSchema);


