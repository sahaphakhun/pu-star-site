import mongoose from 'mongoose';
import { Schema, model, models, Document } from 'mongoose';

// Interface สำหรับ Content Block ที่ยืดหยุ่น
export interface IContentBlock {
  id: string;
  type: 'text' | 'heading' | 'image' | 'quote' | 'list' | 'divider';
  content: any; // จะเป็นข้อมูลต่างกันตาม type
  styles: {
    alignment?: 'left' | 'center' | 'right';
    fontSize?: 'small' | 'normal' | 'large' | 'xlarge';
    fontWeight?: 'normal' | 'bold';
    color?: string;
    backgroundColor?: string;
    padding?: string;
    margin?: string;
  };
  order: number;
}

// Interface สำหรับ Text Content
export interface ITextContent {
  text: string;
  format?: 'paragraph' | 'html';
}

// Interface สำหรับ Heading Content
export interface IHeadingContent {
  text: string;
  level: 1 | 2 | 3 | 4 | 5 | 6;
}

// Interface สำหรับ Image Content
export interface IImageContent {
  src: string;
  alt: string;
  caption?: string;
  width?: 'auto' | '25%' | '50%' | '75%' | '100%';
  height?: string;
  objectFit?: 'cover' | 'contain' | 'fill';
}

// Interface สำหรับ Quote Content
export interface IQuoteContent {
  text: string;
  author?: string;
  source?: string;
}

// Interface สำหรับ List Content
export interface IListContent {
  type: 'ordered' | 'unordered';
  items: string[];
}

// Interface สำหรับ SEO Metadata
export interface ISEOMetadata {
  title: string;
  description: string;
  keywords: string[];
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  canonicalUrl?: string;
  structuredData?: any; // JSON-LD structured data
}

// Interface สำหรับ Article Tag
export interface IArticleTag {
  name: string;
  slug: string;
  description?: string;
  color?: string;
}

// Main Article Interface
export interface IArticle extends Document {
  title: string;
  slug: string;
  excerpt: string;
  featuredImage?: string;
  content: IContentBlock[];
  tags: IArticleTag[]; // เปลี่ยนเป็น array ของ tag objects
  author: {
    name: string;
    email?: string;
    avatar?: string;
  };
  seo: ISEOMetadata;
  status: 'draft' | 'published' | 'archived';
  publishedAt?: Date;
  scheduledAt?: Date; // สำหรับกำหนดเผยแพร่ในอนาคต
  viewCount: number;
  readingTime: number; // นาที (คำนวณอัตโนมัติ)
  relatedArticles: string[]; // Array ของ Article IDs
  comments?: {
    enabled: boolean;
    count: number;
  };
  createdAt: Date;
  updatedAt: Date;
  createdBy: string; // Phone number ของผู้สร้าง
  updatedBy: string; // Phone number ของผู้แก้ไขล่าสุด
}

// Schema สำหรับ Content Block
const contentBlockSchema = new Schema({
  id: { type: String, required: true },
  type: { 
    type: String, 
    required: true,
    enum: ['text', 'heading', 'image', 'quote', 'list', 'divider']
  },
  content: { type: Schema.Types.Mixed, required: true },
  styles: {
    alignment: { 
      type: String, 
      enum: ['left', 'center', 'right'],
      default: 'left'
    },
    fontSize: { 
      type: String, 
      enum: ['small', 'normal', 'large', 'xlarge'],
      default: 'normal'
    },
    fontWeight: { 
      type: String, 
      enum: ['normal', 'bold'],
      default: 'normal'
    },
    color: { type: String },
    backgroundColor: { type: String },
    padding: { type: String },
    margin: { type: String }
  },
  order: { type: Number, required: true }
}, { _id: false });

// Schema สำหรับ SEO Metadata
const seoMetadataSchema = new Schema({
  title: { type: String, required: true, maxlength: 60 },
  description: { type: String, required: true, maxlength: 160 },
  keywords: [{ type: String }],
  ogTitle: { type: String, maxlength: 60 },
  ogDescription: { type: String, maxlength: 160 },
  ogImage: { type: String },
  canonicalUrl: { type: String },
  structuredData: { type: Schema.Types.Mixed }
}, { _id: false });

// Schema สำหรับ Article Tag
const articleTagSchema = new Schema({
  name: { type: String, required: true },
  slug: { type: String, required: true },
  description: { type: String },
  color: { type: String }
}, { _id: false });

// Schema สำหรับ Author
const authorSchema = new Schema({
  name: { type: String, required: true },
  email: { type: String },
  avatar: { type: String }
}, { _id: false });

// Schema สำหรับ Comments
const commentsSchema = new Schema({
  enabled: { type: Boolean, default: true },
  count: { type: Number, default: 0 }
}, { _id: false });

// Main Article Schema
const articleSchema = new Schema<IArticle>(
  {
    title: {
      type: String,
      required: [true, 'ต้องระบุชื่อบทความ'],
      maxlength: [200, 'ชื่อบทความต้องมีความยาวไม่เกิน 200 ตัวอักษร'],
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
    excerpt: {
      type: String,
      required: [true, 'ต้องระบุคำอธิบายสั้น'],
      maxlength: [500, 'คำอธิบายสั้นต้องมีความยาวไม่เกิน 500 ตัวอักษร'],
      trim: true
    },
    featuredImage: {
      type: String,
      validate: {
        validator: function(v: string) {
          return !v || /^\/.*\.(jpg|jpeg|png|webp|gif)$/i.test(v);
        },
        message: 'รูปภาพต้องเป็นไฟล์ .jpg, .jpeg, .png, .webp หรือ .gif เท่านั้น'
      }
    },
    content: [contentBlockSchema],
    tags: [articleTagSchema], // เปลี่ยนเป็น array ของ tag objects
    author: { type: authorSchema, required: true },
    seo: { type: seoMetadataSchema, required: true },
    status: {
      type: String,
      enum: ['draft', 'published', 'archived'],
      default: 'draft'
    },
    publishedAt: { type: Date },
    scheduledAt: { type: Date },
    viewCount: { type: Number, default: 0, min: 0 },
    readingTime: { type: Number, default: 1, min: 1 },
    relatedArticles: [{
      type: String,
      validate: {
        validator: function(v: string) {
          return mongoose.Types.ObjectId.isValid(v);
        },
        message: 'relatedArticles ต้องเป็น ObjectId ที่ถูกต้อง'
      }
    }],
    comments: { type: commentsSchema, default: { enabled: true, count: 0 } },
    createdBy: {
      type: String,
      required: [true, 'ต้องระบุผู้สร้าง'],
      match: [/^[0-9]{10}$/, 'เบอร์โทรศัพท์ต้องเป็นตัวเลข 10 หลัก']
    },
    updatedBy: {
      type: String,
      required: [true, 'ต้องระบุผู้แก้ไข'],
      match: [/^[0-9]{10}$/, 'เบอร์โทรศัพท์ต้องเป็นตัวเลข 10 หลัก']
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Indexes สำหรับการค้นหา
articleSchema.index({ slug: 1 });
articleSchema.index({ status: 1, publishedAt: -1 });
articleSchema.index({ 'tags.slug': 1, status: 1 }); // เปลี่ยนจาก category เป็น tags
articleSchema.index({ 'tags.name': 1, status: 1 }); // เพิ่ม index สำหรับชื่อแท็ก
articleSchema.index({ title: 'text', excerpt: 'text', 'content.content.text': 'text' });

// Virtual สำหรับ URL
articleSchema.virtual('url').get(function() {
  return `/articles/${this.slug}`;
});

// Middleware สำหรับคำนวณเวลาอ่าน
articleSchema.pre('save', function(next) {
  if (this.isModified('content')) {
    // คำนวณเวลาอ่านจากเนื้อหา (สมมติ 200 คำต่อนาที)
    const textContent = this.content
      .filter(block => ['text', 'heading', 'quote', 'list'].includes(block.type))
      .map(block => {
        if (block.type === 'text' || block.type === 'heading' || block.type === 'quote') {
          return block.content.text || '';
        } else if (block.type === 'list') {
          return block.content.items?.join(' ') || '';
        }
        return '';
      })
      .join(' ');
    
    const wordCount = textContent.split(/\s+/).filter(word => word.length > 0).length;
    this.readingTime = Math.max(1, Math.ceil(wordCount / 200));
  }
  next();
});

// Middleware สำหรับ auto-publish
articleSchema.pre('save', function(next) {
  if (this.status === 'published' && !this.publishedAt) {
    this.publishedAt = new Date();
  }
  next();
});

// Static methods
articleSchema.statics.findPublished = function() {
  return this.find({ 
    status: 'published',
    $or: [
      { publishedAt: { $lte: new Date() } },
      { scheduledAt: { $lte: new Date() } }
    ]
  }).sort({ publishedAt: -1 });
};

articleSchema.statics.findByCategory = function(categorySlug: string) {
  return this.find({ 
    'category.slug': categorySlug,
    status: 'published'
  }).sort({ publishedAt: -1 });
};

articleSchema.statics.findByTag = function(tag: string) {
  return this.find({ 
    tags: tag,
    status: 'published'
  }).sort({ publishedAt: -1 });
};

// Instance methods
articleSchema.methods.incrementViewCount = function() {
  this.viewCount += 1;
  return this.save();
};

const Article = models.Article || model<IArticle>('Article', articleSchema);

export default Article;