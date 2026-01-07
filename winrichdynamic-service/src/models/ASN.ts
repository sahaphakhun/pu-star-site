import mongoose, { Schema, Document } from 'mongoose';

export interface IASN extends Document {
  asnNumber: string;
  poNumber?: string;
  supplier: string;
  deliveryDate: Date;
  status: 'pending' | 'receiving' | 'completed';
  items?: Array<{
    productId?: Schema.Types.ObjectId;
    productName: string;
    sku?: string;
    expectedQty: number;
    receivedQty?: number;
    unit?: string;
    lotNumber?: string;
    expiryDate?: Date;
  }>;
}

const asnSchema = new Schema<IASN>(
  {
    asnNumber: { type: String, required: true, trim: true, unique: true },
    poNumber: { type: String, trim: true },
    supplier: { type: String, required: true, trim: true },
    deliveryDate: { type: Date, required: true },
    status: {
      type: String,
      enum: ['pending', 'receiving', 'completed'],
      default: 'pending',
    },
    items: [
      {
        productId: { type: Schema.Types.ObjectId, ref: 'Product' },
        productName: { type: String, required: true },
        sku: { type: String },
        expectedQty: { type: Number, required: true, min: 0 },
        receivedQty: { type: Number, default: 0 },
        unit: { type: String, trim: true },
        lotNumber: { type: String, trim: true },
        expiryDate: { type: Date },
      },
    ],
  },
  { timestamps: true }
);

asnSchema.index({ asnNumber: 1 }, { unique: true });
asnSchema.index({ status: 1 });

export default mongoose.models.ASN || mongoose.model<IASN>('ASN', asnSchema);
