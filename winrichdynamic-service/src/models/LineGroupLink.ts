import mongoose, { Schema, Document } from 'mongoose';

export interface ILineGroupLink extends Document {
  groupId: string;
  customerId: string;
  createdAt: Date;
  updatedAt: Date;
}

const lineGroupLinkSchema = new Schema<ILineGroupLink>({
  groupId: { type: String, required: true, index: true, unique: true, trim: true },
  customerId: { type: String, required: true, index: true, trim: true },
}, {
  timestamps: true,
});

export default mongoose.models.LineGroupLink || mongoose.model<ILineGroupLink>('LineGroupLink', lineGroupLinkSchema);


