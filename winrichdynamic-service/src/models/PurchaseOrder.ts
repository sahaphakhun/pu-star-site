import mongoose, { Schema, Document } from 'mongoose';

export interface IPurchaseOrder extends Document {
  poNumber: string;
  supplier: string;
  orderDate: Date;
  expectedDelivery?: Date;
  status: 'pending' | 'partial' | 'completed' | 'cancelled';
  totalItems: number;
  receivedItems: number;
  totalValue: number;
  items?: Array<{
    productId?: Schema.Types.ObjectId;
    productName: string;
    sku?: string;
    quantity: number;
    receivedQuantity?: number;
    unit?: string;
    cost?: number;
  }>;
}

const purchaseOrderSchema = new Schema<IPurchaseOrder>(
  {
    poNumber: { type: String, required: true, trim: true, unique: true },
    supplier: { type: String, required: true, trim: true },
    orderDate: { type: Date, default: Date.now },
    expectedDelivery: { type: Date },
    status: {
      type: String,
      enum: ['pending', 'partial', 'completed', 'cancelled'],
      default: 'pending',
    },
    totalItems: { type: Number, default: 0 },
    receivedItems: { type: Number, default: 0 },
    totalValue: { type: Number, default: 0 },
    items: [
      {
        productId: { type: Schema.Types.ObjectId, ref: 'Product' },
        productName: { type: String, required: true },
        sku: { type: String },
        quantity: { type: Number, required: true, min: 0 },
        receivedQuantity: { type: Number, default: 0 },
        unit: { type: String, trim: true },
        cost: { type: Number, default: 0 },
      },
    ],
  },
  { timestamps: true }
);

purchaseOrderSchema.index({ poNumber: 1 }, { unique: true });
purchaseOrderSchema.index({ status: 1 });

export default mongoose.models.PurchaseOrder ||
  mongoose.model<IPurchaseOrder>('PurchaseOrder', purchaseOrderSchema);
