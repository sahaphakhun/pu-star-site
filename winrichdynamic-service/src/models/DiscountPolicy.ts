import mongoose, { Schema, Document } from 'mongoose';

export interface IDiscountPolicyCondition {
  customerGroup?: string;
  role?: string; // สิทธิ์ของผู้ใช้ที่สร้างใบเสนอราคา
  productId?: string;
  category?: string;
  minQuantity?: number;
  maxQuantity?: number;
}

export interface IDiscountPolicyRule {
  name: string;
  conditions: IDiscountPolicyCondition;
  maxDiscountPercent?: number; // ส่วนลดสูงสุดที่อนุญาต
  minMarginPercent?: number; // มาร์จิ้นขั้นต่ำที่ต้องคงไว้
  requireApprovalIfExceed?: boolean; // ถ้าเกินต้องอนุมัติ
}

export interface IDiscountPolicy extends Document {
  name: string;
  isActive: boolean;
  effectiveFrom?: Date;
  effectiveTo?: Date;
  rules: IDiscountPolicyRule[];
  createdAt: Date;
  updatedAt: Date;
}

const DiscountPolicyConditionSchema = new Schema<IDiscountPolicyCondition>({
  customerGroup: { type: String, required: false, trim: true, index: true },
  role: { type: String, required: false, trim: true },
  productId: { type: String, required: false, trim: true, index: true },
  category: { type: String, required: false, trim: true, index: true },
  minQuantity: { type: Number, required: false, min: 0 },
  maxQuantity: { type: Number, required: false, min: 0 },
}, { _id: false });

const DiscountPolicyRuleSchema = new Schema<IDiscountPolicyRule>({
  name: { type: String, required: true, trim: true },
  conditions: { type: DiscountPolicyConditionSchema, required: true },
  maxDiscountPercent: { type: Number, required: false, min: 0, max: 100 },
  minMarginPercent: { type: Number, required: false, min: 0, max: 100 },
  requireApprovalIfExceed: { type: Boolean, default: true },
}, { _id: false });

const DiscountPolicySchema = new Schema<IDiscountPolicy>({
  name: { type: String, required: true, trim: true },
  isActive: { type: Boolean, default: true, index: true },
  effectiveFrom: { type: Date, required: false, index: true },
  effectiveTo: { type: Date, required: false, index: true },
  rules: { type: [DiscountPolicyRuleSchema], default: [] },
}, {
  timestamps: true,
});

DiscountPolicySchema.index({ name: 1 }, { unique: false });

export default mongoose.models.DiscountPolicy || mongoose.model<IDiscountPolicy>('DiscountPolicy', DiscountPolicySchema);


