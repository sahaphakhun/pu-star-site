import mongoose, { Schema, Document } from 'mongoose';

export interface IFacebookAutomationLog extends Document {
  postId: string;
  commentId: string;
  psid?: string;
  action: 'comment_reply' | 'private_message';
  status: 'success' | 'failed';
  errorMessage?: string;
  metadata?: any;
  createdAt: Date;
}

const facebookAutomationLogSchema = new Schema<IFacebookAutomationLog>(
  {
    postId: { type: String, required: true, index: true },
    commentId: { type: String, required: true, index: true },
    psid: { type: String },
    action: {
      type: String,
      required: true,
      enum: ['comment_reply', 'private_message'],
    },
    status: {
      type: String,
      required: true,
      enum: ['success', 'failed'],
    },
    errorMessage: { type: String },
    metadata: { type: Schema.Types.Mixed },
  },
  { timestamps: true }
);

// Indexes
facebookAutomationLogSchema.index({ postId: 1, createdAt: -1 });
facebookAutomationLogSchema.index({ commentId: 1 });
facebookAutomationLogSchema.index({ status: 1, createdAt: -1 });

export default
  mongoose.models.FacebookAutomationLog ||
  mongoose.model<IFacebookAutomationLog>(
    'FacebookAutomationLog',
    facebookAutomationLogSchema
  );

