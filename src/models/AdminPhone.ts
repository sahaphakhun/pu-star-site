import mongoose, { Schema, Document } from 'mongoose';

export interface IAdminPhone extends Document {
  phoneNumber: string; // E.164 format 66XXXXXXXXX
}

const schema = new Schema<IAdminPhone>({
  phoneNumber: {
    type: String,
    unique: true,
    required: true,
    match: /^66\d{9}$/
  }
});

export default mongoose.models.AdminPhone || mongoose.model<IAdminPhone>('AdminPhone', schema);
