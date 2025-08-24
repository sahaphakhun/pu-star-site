import mongoose, { Schema, Document } from 'mongoose';

export interface IProduct extends Document {
  name: string;
  description: string;
  price: number;
  cost: number;
  sku: string;
  category: string;
  stock: number;
  unit: string;
  status: 'active' | 'inactive';
  images: string[];
  specifications: Record<string, string>;
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
    required: false,
    trim: true,
    default: ''
  },
  price: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  cost: {
    type: Number,
    required: false,
    min: 0,
    default: 0
  },
  sku: {
    type: String,
    required: true,
    trim: true
  },
  category: {
    type: String,
    required: false,
    trim: true,
    default: ''
  },
  stock: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  unit: {
    type: String,
    required: false,
    trim: true,
    default: 'ชิ้น'
  },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active'
  },
  images: [{
    type: String,
    required: false
  }],
  specifications: {
    type: Map,
    of: String,
    default: {}
  }
}, {
  timestamps: true
});

// Indexes
ProductSchema.index({ name: 1 });
ProductSchema.index({ sku: 1 }, { unique: true });
ProductSchema.index({ category: 1 });
ProductSchema.index({ status: 1 });
ProductSchema.index({ price: 1 });
ProductSchema.index({ stock: 1 });

// Text search index
ProductSchema.index({
  name: 'text',
  description: 'text',
  sku: 'text'
});

// Virtual for profit margin
ProductSchema.virtual('profitMargin').get(function(this: any) {
  if (this.cost > 0) {
    return ((this.price - this.cost) / this.cost * 100).toFixed(2);
  }
  return 0;
});

// Virtual for profit
ProductSchema.virtual('profit').get(function(this: any) {
  return this.price - this.cost;
});

// Virtual for stock status
ProductSchema.virtual('stockStatus').get(function(this: any) {
  if (this.stock === 0) return 'out_of_stock';
  if (this.stock < 10) return 'low_stock';
  return 'in_stock';
});

// Ensure virtual fields are serialized
ProductSchema.set('toJSON', { virtuals: true });
ProductSchema.set('toObject', { virtuals: true });

export default mongoose.models.Product || mongoose.model<IProduct>('Product', ProductSchema);


