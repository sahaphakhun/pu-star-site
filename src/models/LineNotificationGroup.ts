import mongoose, { Schema, Document } from 'mongoose';

export interface ILineNotificationGroup extends Document {
  groupId: string;
  sourceType: 'group' | 'room';
  enabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const lineGroupSchema = new Schema<ILineNotificationGroup>(
  {
    groupId: { type: String, required: true, unique: true, index: true },
    sourceType: { type: String, enum: ['group', 'room'], required: true },
    enabled: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.models.LineNotificationGroup ||
  mongoose.model<ILineNotificationGroup>('LineNotificationGroup', lineGroupSchema);


