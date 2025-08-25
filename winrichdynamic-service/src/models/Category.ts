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
    required: [true, 'กรุณาระบุชื่อหมวดหมู่'],
    trim: true,
    maxlength: [100, 'ชื่อหมวดหมู่ต้องไม่เกิน 100 ตัวอักษร']
  },
  description: {
    type: String,
    required: false,
    trim: true,
    default: '',
    maxlength: [500, 'คำอธิบายต้องไม่เกิน 500 ตัวอักษร']
  },
  slug: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
    unique: true
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
    if (name) {
      this.slug = name
        .toLowerCase()
        .replace(/[^\w\s-]/g, '') // ลบอักขระพิเศษ
        .replace(/\s+/g, '-') // เปลี่ยนช่องว่างเป็น -
        .replace(/-+/g, '-') // ลบ - ที่ซ้ำกัน
        .trim(); // ลบช่องว่างที่หัวและท้าย
    }
  }
  next();
});

// Pre-save middleware to handle duplicate slug
CategorySchema.pre('save', async function(next) {
  if (this.isModified('slug')) {
    const slug = this.get('slug') as string;
    if (slug) {
      const existingCategory = await mongoose.model('Category').findOne({ 
        slug: slug, 
        _id: { $ne: this._id } 
      });
      
      if (existingCategory) {
        // เพิ่ม timestamp เพื่อให้ slug ไม่ซ้ำ
        this.slug = `${slug}-${Date.now()}`;
      }
    }
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


