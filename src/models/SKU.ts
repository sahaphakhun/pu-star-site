import mongoose, { Schema, Document } from 'mongoose';

export interface ISKU extends Document {
  productId: string;
  skuPrefix: string;
  skuCode: string;
  unitLabel?: string;
  options?: Record<string, string>;
  price: number;
  shippingFee?: number;
  isActive: boolean;
  stockQuantity?: number;
  minStockLevel?: number;
  maxStockLevel?: number;
  createdAt: Date;
  updatedAt: Date;
}

const skuSchema = new Schema<ISKU>(
  {
    productId: {
      type: Schema.Types.ObjectId,
      ref: 'Product',
      required: [true, 'กรุณาระบุ ID สินค้า'],
    },
    skuPrefix: {
      type: String,
      required: [true, 'กรุณาระบุตัวอักษรนำหน้า SKU'],
      trim: true,
      maxlength: [10, 'ตัวอักษรนำหน้า SKU ต้องไม่เกิน 10 ตัวอักษร'],
    },
    skuCode: {
      type: String,
      required: [true, 'กรุณาระบุรหัส SKU'],
      trim: true,
      unique: true,
      maxlength: [50, 'รหัส SKU ต้องไม่เกิน 50 ตัวอักษร'],
    },
    unitLabel: {
      type: String,
      required: false,
      trim: true,
    },
    options: {
      type: Schema.Types.Mixed,
      required: false,
      default: {},
    },
    price: {
      type: Number,
      required: [true, 'กรุณาระบุราคา'],
      min: [0, 'ราคาต้องไม่ต่ำกว่า 0'],
    },
    shippingFee: {
      type: Number,
      required: false,
      min: [0, 'ค่าส่งต้องไม่ต่ำกว่า 0'],
    },
    isActive: {
      type: Boolean,
      required: false,
      default: true,
    },
    stockQuantity: {
      type: Number,
      required: false,
      min: [0, 'จำนวนสินค้าคงเหลือต้องไม่ต่ำกว่า 0'],
      default: 0,
    },
    minStockLevel: {
      type: Number,
      required: false,
      min: [0, 'ระดับสินค้าขั้นต่ำต้องไม่ต่ำกว่า 0'],
      default: 0,
    },
    maxStockLevel: {
      type: Number,
      required: false,
      min: [0, 'ระดับสินค้าสูงสุดต้องไม่ต่ำกว่า 0'],
    },
  },
  { 
    timestamps: true 
  }
);

// เพิ่มดัชนีเพื่อเพิ่มประสิทธิภาพการค้นหา
skuSchema.index({ productId: 1, skuCode: 1 });
skuSchema.index({ skuCode: 1 });
skuSchema.index({ isActive: 1 });
skuSchema.index({ stockQuantity: 1 });

// สร้าง SKU Code อัตโนมัติ
skuSchema.pre('save', function(next) {
  if (this.isNew && !this.skuCode) {
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.random().toString(36).substring(2, 5).toUpperCase();
    this.skuCode = `${this.skuPrefix}${timestamp}${random}`;
  }
  next();
});

export default mongoose.models.SKU || mongoose.model<ISKU>('SKU', skuSchema);
