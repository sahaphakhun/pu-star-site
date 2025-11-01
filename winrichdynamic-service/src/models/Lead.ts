import mongoose, { Schema, Document, Model } from 'mongoose';

export type LeadSource = 'facebook' | 'line' | 'website' | 'referral' | 'other';
export type LeadStatus = 'new' | 'qualified' | 'disqualified' | 'converted';

export interface ILead extends Document {
  name: string;
  phone?: string;
  email?: string;
  company?: string;
  source: LeadSource;
  score?: number;
  status: LeadStatus;
  notes?: string;
  ownerId?: string;
  team?: string;
  customerId?: string; // after convert
  dealId?: string; // after convert
  createdAt: Date;
  updatedAt: Date;
}

const leadSchema = new Schema<ILead>({
  name: { type: String, required: true, trim: true, maxlength: 200 },
  phone: { type: String, trim: true },
  email: { type: String, trim: true, lowercase: true },
  company: { type: String, trim: true },
  source: { type: String, enum: ['facebook', 'line', 'website', 'referral', 'other'], default: 'other', index: true },
  score: { type: Number, min: 0, max: 100, default: 0 },
  status: { type: String, enum: ['new', 'qualified', 'disqualified', 'converted'], default: 'new', index: true },
  notes: { type: String, trim: true, maxlength: 2000 },
  ownerId: { type: String, trim: true, index: true },
  team: { type: String, trim: true, index: true },
  customerId: { type: String, trim: true, index: true },
  dealId: { type: String, trim: true, index: true },
}, { timestamps: true });

leadSchema.index({ name: 'text', company: 'text', email: 'text' });
leadSchema.index({ createdAt: -1 });

const LeadModel: Model<ILead> = (mongoose.models.Lead as Model<ILead>) || mongoose.model<ILead>('Lead', leadSchema);

export default LeadModel;


