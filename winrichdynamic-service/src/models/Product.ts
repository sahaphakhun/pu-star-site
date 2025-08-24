import mongoose, { Schema, Document } from 'mongoose';

export interface IProduct extends Document {
  name: string;
  description: string;
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

// Indexes
ProductSchema.index({ name: 1 });
ProductSchema.index({ category: 1 });
ProductSchema.index({ isAvailable: 1 });
ProductSchema.index({ 'skuVariants.sku': 1 });

// Text search index
ProductSchema.index({
  name: 'text',
  description: 'text'
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


