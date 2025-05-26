import mongoose, { Schema, Document } from 'mongoose';

export interface IShippingSetting extends Document {
  freeThreshold: number; // ยอดซื้อขั้นต่ำที่ได้ส่งฟรี
  fee: number; // ค่าจัดส่งปกติ
}

const shippingSchema = new Schema<IShippingSetting>({
  freeThreshold: {
    type: Number,
    required: true,
    default: 500,
  },
  fee: {
    type: Number,
    required: true,
    default: 50,
  },
});

export default mongoose.models.ShippingSetting || mongoose.model<IShippingSetting>('ShippingSetting', shippingSchema); 