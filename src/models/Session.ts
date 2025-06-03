import mongoose, { Schema, Document } from 'mongoose';

interface CartItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  selectedOptions?: Record<string, string>;
  unitLabel?: string;
  unitPrice?: number;
}

export interface ISession extends Document {
  psid: string;
  step: string;
  cart: CartItem[];
  tempData?: Record<string, unknown>;
  updatedAt: Date;
}

const CartItemSchema = new Schema<CartItem>({
  productId: { type: String, required: true },
  name: { type: String, required: true },
  price: { type: Number, required: true },
  quantity: { type: Number, required: true },
  selectedOptions: { type: Object },
  unitLabel: String,
  unitPrice: Number,
});

const SessionSchema = new Schema<ISession>({
  psid: { type: String, required: true, unique: true, index: true },
  step: { type: String, default: 'browse' },
  cart: { type: [CartItemSchema], default: [] },
  tempData: { type: Object },
  updatedAt: { type: Date, default: Date.now },
});

// TTL ลบ session ออกหลัง 3 วันไม่มีอัปเดต
SessionSchema.index({ updatedAt: 1 }, { expireAfterSeconds: 259200 });

export default (mongoose.models.Session as mongoose.Model<ISession>) || mongoose.model<ISession>('Session', SessionSchema); 