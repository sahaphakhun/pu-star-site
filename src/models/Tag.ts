import mongoose from 'mongoose';
import { Schema, model, models, Document } from 'mongoose';

// Interface สำหรับ Tag
export interface ITag extends Document {
  name: string;
  slug: string;
  description?: string;
  color?: string;
  articleCount: number; // จำนวนบทความที่ใช้แท็กนี้
  createdAt: Date;
  updatedAt: Date;
  createdBy: string; // Phone number ของผู้สร้าง
  updatedBy: string; // Phone number ของผู้แก้ไขล่าสุด
}

// Tag Schema
const tagSchema = new Schema<ITag>(
  {
    name: {
      type: String,
      required: [true, 'ต้องระบุชื่อแท็ก'],
      maxlength: [50, 'ชื่อแท็กต้องมีความยาวไม่เกิน 50 ตัวอักษร'],
      trim: true
    },
    slug: {
      type: String,
      required: [true, 'ต้องระบุ slug'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^[a-z0-9-]+$/, 'slug ต้องประกอบด้วยตัวอักษรภาษาอังกฤษพิมพ์เล็ก ตัวเลข และเครื่องหมาย - เท่านั้น']
    },
    description: {
      type: String,
      maxlength: [200, 'คำอธิบายต้องมีความยาวไม่เกิน 200 ตัวอักษร'],
      trim: true
    },
    color: {
      type: String,
      match: [/^#[0-9A-F]{6}$/i, 'สีต้องเป็นรูปแบบ HEX (#RRGGBB)'],
      default: '#3B82F6'
    },
    articleCount: {
      type: Number,
      default: 0,
      min: 0
    },
    createdBy: {
      type: String,
      required: [true, 'ต้องระบุผู้สร้าง']
    },
    updatedBy: {
      type: String,
      required: [true, 'ต้องระบุผู้แก้ไข']
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Indexes (เอา slug ออกเพราะมี unique: true แล้ว)
tagSchema.index({ name: 1 });
tagSchema.index({ articleCount: -1 });

// Virtual สำหรับ URL
tagSchema.virtual('url').get(function() {
  return `/articles?tag=${this.slug}`;
});

// Middleware สำหรับตั้งเวลาไทย
tagSchema.pre('save', function(next) {
  const now = new Date();
  // แปลงเป็นเวลาไทย (UTC+7)
  const thaiTime = new Date(now.getTime() + (7 * 60 * 60 * 1000));
  
  if (this.isNew) {
    this.createdAt = thaiTime;
  }
  this.updatedAt = thaiTime;
  
  next();
});

const Tag = models.Tag || model<ITag>('Tag', tagSchema);

export default Tag;