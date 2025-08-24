import mongoose, { Schema, Document } from 'mongoose';

export interface ICategory extends Document {
  name: string;
  description: string;
  slug: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const CategorySchema: Schema = new Schema({
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
  slug: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Indexes
CategorySchema.index({ name: 1 });
CategorySchema.index({ slug: 1 }, { unique: true });
CategorySchema.index({ isActive: 1 });

// Pre-save middleware to generate slug
CategorySchema.pre('save', function(next) {
  if (this.isModified('name')) {
    const name = this.get('name') as string;
    this.slug = name
      .toLowerCase()
      .replace(/[^\w\s-]/g, '') // ลบอักขระพิเศษ
      .replace(/\s+/g, '-') // เปลี่ยนช่องว่างเป็น -
      .replace(/-+/g, '-') // ลบ - ที่ซ้ำกัน
      .trim(); // ลบช่องว่างที่หัวและท้าย
  }
  next();
});

// Virtual for product count (จะต้อง populate เอง)
CategorySchema.virtual('productCount', {
  ref: 'Product',
  localField: '_id',
  foreignField: 'category',
  count: true
});

// Ensure virtual fields are serialized
CategorySchema.set('toJSON', { virtuals: true });
CategorySchema.set('toObject', { virtuals: true });

export default mongoose.models.Category || mongoose.model<ICategory>('Category', CategorySchema);


