import mongoose, { Schema, Document } from 'mongoose';

export interface IOrderItem {
	productId?: Schema.Types.ObjectId;
	name: string;
	description?: string;
	price: number;
	quantity: number;
	discount?: number;
	amount?: number;
	sku?: string;
	selectedOptions?: Record<string, string>;
	unitLabel?: string;
	unitPrice?: number;
}

export interface IOrder extends Document {
	customerId?: Schema.Types.ObjectId;
	salesOrderNumber?: string;
	quotationId?: string;
	customerName: string;
	customerPhone: string;
	contactName?: string;
	contactEmail?: string;
	contactPhone?: string;
	items: IOrderItem[];
	subtotal?: number;
	vatRate?: number;
	vatAmount?: number;
	totalAmount: number;
	shippingFee: number;
	discount?: number;
	orderDate: Date;
	deliveryDate?: Date;
	deliveryStatus?: 'pending' | 'preparing' | 'shipped' | 'delivered';
	deliveryAddress?: string;
	deliveryProvince?: string;
	deliveryDistrict?: string;
	deliverySubdistrict?: string;
	deliveryPostalCode?: string;
	ownerId?: Schema.Types.ObjectId;
	team?: string;
	importance?: number;
	paymentStatus?: 'unpaid' | 'partial' | 'paid';
	paidAmount?: number;
	remainingAmount?: number;
	paymentTerms?: string;
	paymentDueDate?: Date;
	notes?: string;
	internalNotes?: string;
	createdAt: Date;
	updatedAt: Date;
  orderType?: 'online' | 'sales_order';
	paymentMethod?: 'cod' | 'transfer' | 'credit';
  status?: 'pending' | 'confirmed' | 'ready' | 'shipped' | 'delivered' | 'cancelled';
  trackingNumber?: string;
  shippingProvider?: string;
  deliveryMethod?: string;
  // COD specific fields
  codPaymentStatus?: 'pending' | 'collected' | 'failed';
  codPaymentDueDate?: Date;
  codReminderSent?: boolean;
  paymentConfirmationRequired?: boolean;
  // Credit payment fields
  creditPaymentDueDate?: Date;
  creditReminderSent?: boolean;
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
    slipUrl?: string;
    slipUploadedAt?: Date;
  };
  
  // Quotation linkage
  generatedQuotationId?: string;
  quotationGeneratedAt?: Date;
  quotationRequired?: boolean; // Based on product/configuration
  quotationStatus?: 'pending' | 'generated' | 'accepted' | 'rejected';
  autoConvertToSalesOrder?: boolean;
  sourceQuotationId?: string;
  sourceOrderId?: string;
  linkedSalesOrderId?: string;
  salesOrderGeneratedAt?: Date;
}

const orderItemSchema = new Schema<IOrderItem>({
	productId: { type: Schema.Types.ObjectId, ref: 'Product' },
	name: { type: String, required: true },
	description: { type: String },
	price: { type: Number, required: true },
	quantity: { type: Number, required: true, min: 1 },
	discount: { type: Number, default: 0 },
	amount: { type: Number },
	sku: { type: String },
	selectedOptions: { type: Schema.Types.Mixed, default: {} },
	unitLabel: { type: String },
	unitPrice: { type: Number },
});

const orderSchema = new Schema<IOrder>(
	{
		customerId: { type: Schema.Types.ObjectId, ref: 'Customer', index: true },
		salesOrderNumber: { type: String, trim: true, index: true },
		quotationId: { type: String, trim: true, index: true },
		customerName: { type: String, required: true, trim: true },
		customerPhone: { type: String, required: true, trim: true },
		contactName: { type: String, trim: true },
		contactEmail: { type: String, trim: true },
		contactPhone: { type: String, trim: true },
		items: [orderItemSchema],
		subtotal: { type: Number },
		vatRate: { type: Number },
		vatAmount: { type: Number },
		totalAmount: { type: Number, required: true },
		shippingFee: { type: Number, required: true, default: 0 },
		discount: { type: Number, default: 0 },
		orderDate: { type: Date, default: Date.now },
		deliveryDate: { type: Date },
		deliveryStatus: { type: String, enum: ['pending', 'preparing', 'shipped', 'delivered'], default: 'pending' },
		deliveryAddress: { type: String },
		deliveryProvince: { type: String },
		deliveryDistrict: { type: String },
		deliverySubdistrict: { type: String },
		deliveryPostalCode: { type: String },
		ownerId: { type: Schema.Types.ObjectId, ref: 'Admin', index: true },
		team: { type: String, trim: true, index: true },
		importance: { type: Number, default: 3 },
		paymentStatus: { type: String, enum: ['unpaid', 'partial', 'paid'], default: 'unpaid' },
		paidAmount: { type: Number, default: 0 },
		remainingAmount: { type: Number, default: 0 },
		paymentTerms: { type: String },
		paymentDueDate: { type: Date },
		notes: { type: String },
		internalNotes: { type: String },
    orderType: { type: String, enum: ['online', 'sales_order'], default: 'online', index: true },
		paymentMethod: { type: String, enum: ['cod', 'transfer', 'credit'], default: 'cod' },
    status: { type: String, enum: ['pending', 'confirmed', 'ready', 'shipped', 'delivered', 'cancelled'], default: 'pending' },
    trackingNumber: { type: String },
    shippingProvider: { type: String },
    deliveryMethod: { type: String, default: 'standard' },
    // COD specific fields
    codPaymentStatus: { type: String, enum: ['pending', 'collected', 'failed'], default: 'pending' },
    codPaymentDueDate: { type: Date },
    codReminderSent: { type: Boolean, default: false },
    paymentConfirmationRequired: { type: Boolean, default: false },
    // Credit payment fields
    creditPaymentDueDate: { type: Date },
    creditReminderSent: { type: Boolean, default: false },
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
      slipUrl: { type: String },
      slipUploadedAt: { type: Date },
    },
    // Quotation linkage
    generatedQuotationId: { type: String },
    quotationGeneratedAt: { type: Date },
    quotationRequired: { type: Boolean, default: false },
    quotationStatus: { type: String, enum: ['pending', 'generated', 'accepted', 'rejected'] },
    autoConvertToSalesOrder: { type: Boolean, default: false },
    sourceQuotationId: { type: String },
    sourceOrderId: { type: String },
    linkedSalesOrderId: { type: String },
    salesOrderGeneratedAt: { type: Date },
 },
 { timestamps: true }
);

orderSchema.index({ orderDate: -1 });
orderSchema.index({ customerPhone: 1 });

export default mongoose.models.Order || mongoose.model<IOrder>('Order', orderSchema);
