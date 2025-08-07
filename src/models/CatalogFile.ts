import mongoose, { Schema, Document } from 'mongoose';

export interface ICatalogFile extends Document {
  title: string;
  fileUrl: string;
  fileName: string;
  fileType?: string;
  fileSize?: number;
  category?: string;
  createdAt: Date;
  updatedAt: Date;
}

const catalogFileSchema = new Schema<ICatalogFile>(
  {
    title: { type: String, required: true, trim: true },
    fileUrl: { type: String, required: true },
    fileName: { type: String, required: true },
    fileType: { type: String },
    fileSize: { type: Number },
    category: { type: String },
  },
  { timestamps: true }
);

catalogFileSchema.index({ createdAt: -1 });

export default (mongoose.models.CatalogFile as mongoose.Model<ICatalogFile>) ||
  mongoose.model<ICatalogFile>('CatalogFile', catalogFileSchema);


