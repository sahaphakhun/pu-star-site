import mongoose, { Schema, Document } from 'mongoose';

export interface ICatalogFile extends Document {
  title: string;
  displayName?: string; // ชื่อที่แสดงให้ลูกค้าเห็น
  fileUrl: string;
  fileName: string;
  fileType?: string;
  fileSize?: number;
  category?: string;
  // สำหรับชุดรูปภาพ
  isImageSet?: boolean;
  imageUrls?: string[];
  imageCount?: number;
  createdAt: Date;
  updatedAt: Date;
}

const catalogFileSchema = new Schema<ICatalogFile>(
  {
    title: { type: String, required: true, trim: true },
    displayName: { type: String, trim: true }, // ชื่อที่แสดงให้ลูกค้าเห็น
    fileUrl: { type: String, required: true },
    fileName: { type: String, required: true },
    fileType: { type: String },
    fileSize: { type: Number },
    category: { type: String },
    // สำหรับชุดรูปภาพ
    isImageSet: { type: Boolean, default: false },
    imageUrls: [{ type: String }],
    imageCount: { type: Number, default: 1 },
  },
  { timestamps: true }
);

catalogFileSchema.index({ createdAt: -1 });
catalogFileSchema.index({ category: 1 });
catalogFileSchema.index({ isImageSet: 1 });

export default (mongoose.models.CatalogFile as mongoose.Model<ICatalogFile>) ||
  mongoose.model<ICatalogFile>('CatalogFile', catalogFileSchema);


