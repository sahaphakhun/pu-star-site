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
    required: false, // เปลี่ยนเป็น false เพื่อให้ pre-save middleware ทำงานได้
    trim: true,
    lowercase: true,
    unique: true,
    sparse: true // เพิ่ม sparse index เพื่อให้ unique ทำงานกับ null values
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Indexes - ลบ duplicate index
CategorySchema.index({ name: 1 });
CategorySchema.index({ isActive: 1 });
// ไม่ต้องเพิ่ม index สำหรับ slug เพราะ unique: true จะสร้าง index ให้อัตโนมัติ

// Pre-save middleware to generate slug - ปรับปรุงให้ทำงานเสมอ
CategorySchema.pre('save', function(next) {
  try {
    // สร้าง slug เสมอเมื่อสร้างใหม่ หรือเมื่อ name ถูกแก้ไข
    if (this.isNew || this.isModified('name')) {
      const name = this.get('name') as string;
      if (name && name.trim()) {
        let slug = name
          .toLowerCase()
          .replace(/[^\w\s-]/g, '') // ลบอักขระพิเศษ
          .replace(/\s+/g, '-') // เปลี่ยนช่องว่างเป็น -
          .replace(/-+/g, '-') // ลบ - ที่ซ้ำกัน
          .trim(); // ลบช่องว่างที่หัวและท้าย
        
        // ตรวจสอบว่า slug ไม่ว่าง
        if (slug) {
          this.slug = slug;
        } else {
          // ถ้า slug ว่าง ให้ใช้ชื่อภาษาอังกฤษ
          this.slug = `category-${Date.now()}`;
        }
      }
    }
    
    // ตรวจสอบว่า slug มีค่าหรือไม่ ถ้าไม่มีให้สร้างค่าเริ่มต้น
    const currentSlug = this.get('slug') as string;
    if (!currentSlug || currentSlug.trim() === '') {
      this.slug = `category-${Date.now()}`;
    }
    
    next();
  } catch (error) {
    console.error('[B2B] Error in slug generation:', error);
    // สร้าง slug เริ่มต้นถ้าเกิดข้อผิดพลาด
    this.slug = `category-${Date.now()}`;
    next();
  }
});

// Pre-save middleware to handle duplicate slug
CategorySchema.pre('save', async function(next) {
  try {
    if (this.isModified('slug') && this.slug) {
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
  } catch (error) {
    console.error('[B2B] Error in duplicate slug handling:', error);
    // สร้าง slug ใหม่ถ้าเกิดข้อผิดพลาด
    this.slug = `category-${Date.now()}`;
    next();
  }
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


