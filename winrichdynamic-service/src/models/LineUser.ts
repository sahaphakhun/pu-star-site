import mongoose, { Schema, Document } from 'mongoose';

export interface ILineUser extends Document {
  lineUserId: string;
  displayName?: string;
  pictureUrl?: string;
  canIssueQuotation: boolean;
  isActive: boolean;
  lastSeenAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const lineUserSchema = new Schema<ILineUser>(
  {
    lineUserId: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
    },
    displayName: {
      type: String,
      trim: true,
      maxlength: 200,
    },
    pictureUrl: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    canIssueQuotation: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    lastSeenAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.LineUser ||
  mongoose.model<ILineUser>('LineUser', lineUserSchema);
