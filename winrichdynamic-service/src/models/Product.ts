import mongoose, { Schema, Document } from 'mongoose';

export interface IProduct extends Document {
  name: string;
  description: string;
  sku: string; // เพิ่ม field sku หลัก
  price?: number; // Optional when using units
  shippingFee?: number; // Optional when using units
  units?: Array<{
    label: string;
    price: number;
    shippingFee?: number;
  }>;
  category: string;
  imageUrl: string;
  isAvailable: boolean;
  options?: Array<{
    name: string;
    values: Array<{
      label: string;
      imageUrl?: string;
      isAvailable?: boolean;
    }>;
  }>;
  skuConfig?: {
    prefix: string;
    separator: string;
    autoGenerate: boolean;
    customSku?: string;
  };
  skuVariants?: Array<{
    key: string;
    unitLabel?: string;
    options: Record<string, string>;
    sku: string;
    isActive: boolean;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

const ProductSchema: Schema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  sku: {
    type: String,
    required: true,
    unique: true, // เพิ่ม unique constraint
    trim: true
  },
  price: {
    type: Number,
    required: false,
    min: 0
  },
  shippingFee: {
    type: Number,
    required: false,
    min: 0
  },
  units: [{
    label: {
      type: String,
      required: true,
      trim: true
    },
    price: {
      type: Number,
      required: true,
      min: 0
    },
    shippingFee: {
      type: Number,
      required: false,
      min: 0
    }
  }],
  category: {
    type: String,
    required: true,
    trim: true,
    default: 'ทั่วไป'
  },
  imageUrl: {
    type: String,
    required: true,
    trim: true
  },
  isAvailable: {
    type: Boolean,
    default: true
  },
  options: [{
    name: {
      type: String,
      required: true,
      trim: true
    },
    values: [{
      label: {
        type: String,
        required: true,
        trim: true
      },
      imageUrl: {
        type: String,
        required: false,
        trim: true
      },
      isAvailable: {
        type: Boolean,
        default: true
      }
    }]
  }],
  skuConfig: {
    prefix: {
      type: String,
      required: false,
      trim: true
    },
    separator: {
      type: String,
      required: false,
      trim: true,
      default: '-'
    },
    autoGenerate: {
      type: Boolean,
      required: false,
      default: true
    },
    customSku: {
      type: String,
      required: false,
      trim: true
    }
  },
  skuVariants: [{
    key: {
      type: String,
      required: true,
      trim: true
    },
    unitLabel: {
      type: String,
      required: false,
      trim: true
    },
    options: {
      type: Map,
      of: String,
      default: {}
    },
    sku: {
      type: String,
      required: true,
      trim: true
    },
    isActive: {
      type: Boolean,
      default: true
    }
  }]
}, {
  timestamps: true
});

// Indexes - แก้ไข index ให้ถูกต้อง
ProductSchema.index({ name: 1 });
ProductSchema.index({ category: 1 });
ProductSchema.index({ isAvailable: 1 });
ProductSchema.index({ 'skuVariants.sku': 1 }); // index สำหรับ sku variants

// Text search index
ProductSchema.index({
  name: 'text',
  description: 'text'
});

// Pre-save middleware สำหรับ auto-generate SKU
ProductSchema.pre('save', async function(next) {
  // ถ้าไม่มี SKU ให้ auto-generate
  if (!this.sku) {
    try {
      // ตรวจสอบ skuConfig และ autoGenerate
      const skuConfig = this.skuConfig as any;
      const shouldAutoGenerate = skuConfig?.autoGenerate !== false; // default เป็น true
      
      if (shouldAutoGenerate) {
        // สร้าง SKU จาก prefix + timestamp + random string
        const timestamp = Date.now().toString(36);
        const randomStr = Math.random().toString(36).substring(2, 8);
        const prefix = skuConfig?.prefix || 'PRD';
        const separator = skuConfig?.separator || '-';
        
        this.sku = `${prefix}${separator}${timestamp}${separator}${randomStr}`.toUpperCase();
        
        // ตรวจสอบว่า SKU ไม่ซ้ำ
        const existingProduct = await mongoose.model('Product').findOne({ sku: this.sku });
        if (existingProduct) {
          // ถ้าซ้ำให้เพิ่ม random string อีก
          const extraRandom = Math.random().toString(36).substring(2, 6);
          this.sku = `${this.sku}${separator}${extraRandom}`.toUpperCase();
        }
      } else {
        // ถ้าไม่ auto-generate แต่ไม่มี SKU ให้สร้าง fallback
        this.sku = `PRD-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`.toUpperCase();
      }
    } catch (error) {
      console.error('Error generating SKU:', error);
      // ถ้าเกิด error ให้ใช้ fallback SKU
      this.sku = `PRD-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`.toUpperCase();
    }
  }
  
  // ถ้ายังไม่มี SKU ให้สร้าง fallback
  if (!this.sku) {
    this.sku = `PRD-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`.toUpperCase();
  }
  
  next();
});

// Virtual for display price
ProductSchema.virtual('displayPrice').get(function(this: any) {
  if (this.price !== undefined) {
    return this.price;
  }
  if (this.units && this.units.length > 0) {
    return this.units[0].price;
  }
  return 0;
});

// Virtual for display shipping fee
ProductSchema.virtual('displayShippingFee').get(function(this: any) {
  if (this.shippingFee !== undefined) {
    return this.shippingFee;
  }
  if (this.units && this.units.length > 0) {
    return this.units[0].shippingFee || 0;
  }
  return 0;
});

// Ensure virtual fields are serialized
ProductSchema.set('toJSON', { virtuals: true });
ProductSchema.set('toObject', { virtuals: true });

export default mongoose.models.Product || mongoose.model<IProduct>('Product', ProductSchema);


