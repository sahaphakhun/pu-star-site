import mongoose, { Schema, Document } from 'mongoose';

export interface ISiteSetting extends Document {
  siteName: string;
  logoUrl: string;
  updatedAt: Date;
  createdAt: Date;
}

const siteSettingSchema = new Schema<ISiteSetting>(
  {
    siteName: {
      type: String,
      required: true,
      default: 'WINRICH DYNAMIC',
      trim: true,
      maxlength: 200,
    },
    logoUrl: {
      type: String,
      required: true,
      // ใช้รูปเดิมใน public เป็นค่าเริ่มต้น
      default: '/logo.jpg',
      trim: true,
    },
  },
  { timestamps: true }
);

export default mongoose.models.SiteSetting || mongoose.model<ISiteSetting>('SiteSetting', siteSettingSchema);


