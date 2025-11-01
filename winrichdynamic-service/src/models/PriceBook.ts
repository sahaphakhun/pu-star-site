import mongoose, { Schema, Document } from 'mongoose';

export interface IPriceBookRule {
  productId?: string;
  category?: string;
  unitLabel?: string;
  price?: number; // ราคาต่อหน่วย (รวมภาษี)
  maxDiscountPercent?: number; // ส่วนลดสูงสุดที่อนุญาตสำหรับกฎนี้
  minMarginPercent?: number; // มาร์จิ้นขั้นต่ำที่อนุญาต (optional)
}

export interface IPriceBook extends Document {
  name: string;
  currency?: string;
  isActive: boolean;
  customerGroup?: string; // กลุ่มลูกค้าที่ผูก (optional)
  effectiveFrom?: Date;
  effectiveTo?: Date;
  rules: IPriceBookRule[];
  createdAt: Date;
  updatedAt: Date;
}

const PriceBookRuleSchema = new Schema<IPriceBookRule>({
  productId: { type: String, required: false, index: true, trim: true },
  category: { type: String, required: false, index: true, trim: true },
  unitLabel: { type: String, required: false, trim: true },
  price: { type: Number, required: false, min: 0 },
  maxDiscountPercent: { type: Number, required: false, min: 0, max: 100, default: 100 },
  minMarginPercent: { type: Number, required: false, min: 0, max: 100 },
}, { _id: false });

const PriceBookSchema = new Schema<IPriceBook>({
  name: { type: String, required: true, trim: true },
  currency: { type: String, required: false, trim: true, default: 'THB' },
  isActive: { type: Boolean, default: true, index: true },
  customerGroup: { type: String, required: false, trim: true, index: true },
  effectiveFrom: { type: Date, required: false, index: true },
  effectiveTo: { type: Date, required: false, index: true },
  rules: { type: [PriceBookRuleSchema], default: [] },
}, {
  timestamps: true,
});

PriceBookSchema.index({ name: 1 }, { unique: false });

export default mongoose.models.PriceBook || mongoose.model<IPriceBook>('PriceBook', PriceBookSchema);


