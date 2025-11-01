import mongoose, { Schema, Document } from 'mongoose';

export interface ISiteSetting extends Document {
  logoUrl?: string;
  shipping: {
    baseFee: number;
    freeThreshold?: number;
  };
}

const siteSettingSchema = new Schema<ISiteSetting>({
  logoUrl: { type: String },
  shipping: {
    baseFee: { type: Number, default: 0 },
    freeThreshold: { type: Number },
  },
}, { timestamps: true });

export default mongoose.models.SiteSetting || mongoose.model<ISiteSetting>('SiteSetting', siteSettingSchema);


