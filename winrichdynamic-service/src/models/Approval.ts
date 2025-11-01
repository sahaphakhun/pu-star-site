import mongoose, { Schema, Document, Model } from 'mongoose';

export type ApprovalTarget = 'deal' | 'quotation';
export type ApprovalStatus = 'pending' | 'approved' | 'rejected';

export interface IApproval extends Document {
  targetType: ApprovalTarget;
  targetId: string;
  requestedBy: string; // adminId
  approverId?: string; // adminId
  status: ApprovalStatus;
  reason?: string; // เหตุผลการขอ
  decisionReason?: string; // เหตุผลการตัดสินใจ
  team?: string;
  createdAt: Date;
  updatedAt: Date;
}

const approvalSchema = new Schema<IApproval>({
  targetType: { type: String, enum: ['deal', 'quotation'], required: true, index: true },
  targetId: { type: String, required: true, index: true, trim: true },
  requestedBy: { type: String, required: true, index: true, trim: true },
  approverId: { type: String, index: true, trim: true },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending', index: true },
  reason: { type: String, trim: true, maxlength: 1000 },
  decisionReason: { type: String, trim: true, maxlength: 1000 },
  team: { type: String, index: true, trim: true },
}, { timestamps: true });

approvalSchema.index({ targetType: 1, targetId: 1, status: 1 });

const ApprovalModel: Model<IApproval> = (mongoose.models.Approval as Model<IApproval>) || mongoose.model<IApproval>('Approval', approvalSchema);

export default ApprovalModel;


