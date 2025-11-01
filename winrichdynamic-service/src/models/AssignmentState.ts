import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IAssignmentState extends Document {
  scope: 'lead';
  team?: string; // ถ้าไม่ระบุ = global
  roleName: 'Seller';
  lastAssignedAdminId?: string; // admin._id ล่าสุดที่รับงาน
  updatedAt: Date;
  createdAt: Date;
}

const assignmentStateSchema = new Schema<IAssignmentState>({
  scope: { type: String, enum: ['lead'], required: true, index: true },
  team: { type: String, trim: true, index: true },
  roleName: { type: String, enum: ['Seller'], required: true },
  lastAssignedAdminId: { type: String, trim: true },
}, { timestamps: true });

assignmentStateSchema.index({ scope: 1, team: 1 }, { unique: true, sparse: false });

const AssignmentStateModel: Model<IAssignmentState> =
  (mongoose.models.AssignmentState as Model<IAssignmentState>) ||
  mongoose.model<IAssignmentState>('AssignmentState', assignmentStateSchema);

export default AssignmentStateModel;


