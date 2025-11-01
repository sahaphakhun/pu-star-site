import mongoose, { Schema, Document } from 'mongoose';
import type { WMSVariantConfig } from '@/types/wms';

export interface IProduct extends Document {
  name: string;
  price: number;
  description: string;
  imageUrl: string;
  units?: {
    label: string;
    price: number;
    multiplier?: number;
    shippingFee?: number;
  }[];
  category?: string;
  options?: {
    name: string;
    values: {
      label: string;
      imageUrl?: string;
      isAvailable?: boolean;
    }[];
    shippingFee?: number;
    unitPrice?: number;
  }[];
  // SKU Configuration
  skuConfig?: {
    prefix: string;
    separator: string;
    autoGenerate: boolean;
    customSku?: string;
  };
  skuVariants?: {
    key: string;
    unitLabel?: string;
    options: Record<string, string>;
    sku: string;
    isActive: boolean;
  }[];
  wmsConfig?: {
    productCode: string;
    lotGen: string;
    locationBin: string;
    lotMfg?: string;
    adminUsername: string;
    isEnabled: boolean;
  };
  wmsVariantConfigs?: WMSVariantConfig[];
  isAvailable?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const productSchema = new Schema<IProduct>(
  {
    name: {
      type: String,
      required: [true, 'กรุณาระบุชื่อสินค้า'],
      trim: true,
    },
    price: {
      type: Number,
      required: true,
      min: [0, 'ราคาต้องไม่ต่ำกว่า 0'],
    },
    description: {
      type: String,
      required: [true, 'กรุณาระบุรายละเอียดสินค้า'],
      trim: true,
    },
    imageUrl: {
      type: String,
      required: [true, 'กรุณาระบุรูปภาพสินค้า'],
    },
    units: {
      type: [
        {
          label: { type: String, required: true },
          price: { type: Number, required: true, min: [0, 'ราคาต้องไม่ต่ำกว่า 0'] },
          multiplier: { type: Number, required: false, min: 1, default: 1 },
          shippingFee: { type: Number, required: false, min: 0 },
        },
      ],
      required: false,
    },
    category: {
      type: String,
      required: false,
      trim: true,
      default: 'ทั่วไป',
    },
    options: {
      type: [
        {
          name: { type: String, required: true },
          values: [
            {
              label: { type: String, required: true },
              imageUrl: { type: String, required: false },
              isAvailable: { type: Boolean, required: false, default: true },
            },
          ],
        },
      ],
      required: false,
    },
    // SKU Configuration Schema
    skuConfig: {
      type: {
        prefix: { type: String, required: false, trim: true, default: '' },
        separator: { type: String, required: false, trim: true, default: '-' },
        autoGenerate: { type: Boolean, required: false, default: true },
        customSku: { type: String, required: false, trim: true },
      },
      required: false,
    },
    // SKU Variants Schema
    skuVariants: {
      type: [
        new Schema(
          {
            key: { type: String, required: true, trim: true },
            unitLabel: { type: String, required: false, trim: true },
            options: { type: Schema.Types.Mixed, required: false, default: {} },
            sku: { type: String, required: true, trim: true },
            isActive: { type: Boolean, required: false, default: true },
          },
          { _id: false }
        ),
      ],
      required: false,
      default: undefined,
    },
    wmsConfig: {
      type: {
        productCode: { type: String, required: true, trim: true },
        lotGen: { type: String, required: true, trim: true },
        locationBin: { type: String, required: true, trim: true },
        lotMfg: { type: String, required: false, trim: true },
        adminUsername: { type: String, required: true, trim: true },
        isEnabled: { type: Boolean, required: true, default: false }
      },
      required: false,
    },
    wmsVariantConfigs: {
      type: [
        new Schema(
          {
            key: { type: String, required: true, trim: true },
            unitLabel: { type: String, required: false, trim: true },
            options: { type: Schema.Types.Mixed, required: false, default: {} },
            productCode: { type: String, required: true, trim: true },
            lotGen: { type: String, required: true, trim: true },
            locationBin: { type: String, required: true, trim: true },
            lotMfg: { type: String, required: false, trim: true },
            adminUsername: { type: String, required: true, trim: true },
            isEnabled: { type: Boolean, required: false, default: true },
          },
          { _id: false }
        ),
      ],
      required: false,
      default: undefined,
    },
    shippingFee: {
      type: Number,
      required: false,
      min: 0,
    },
    isAvailable: {
      type: Boolean,
      required: false,
      default: true,
    },
  },
  { 
    timestamps: true 
  }
);

// เพิ่มดัชนีเพื่อเพิ่มประสิทธิภาพการค้นหาและการจัดเรียง
productSchema.index({ category: 1, createdAt: -1 });
// ดัชนี full-text สำหรับค้นหาชื่อและรายละเอียดสินค้า
productSchema.index({ name: 'text', description: 'text' });
// ดัชนีสำหรับค้นหา SKU
productSchema.index({ 'skuVariants.sku': 1 });

export default mongoose.models.Product || mongoose.model<IProduct>('Product', productSchema); 