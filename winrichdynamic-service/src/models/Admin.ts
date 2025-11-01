import mongoose, { Schema, Document } from 'mongoose';

export interface IAdmin extends Document {
  name: string;
  phone: string;
  email?: string;
  company?: string;
  role: mongoose.Types.ObjectId;
  team?: string;
  zone?: string;
  isActive: boolean;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const AdminSchema: Schema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  phone: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  email: {
    type: String,
    required: false,
    trim: true,
    lowercase: true
  },
  company: {
    type: String,
    required: false,
    trim: true
  },
  role: {
    type: Schema.Types.ObjectId,
    ref: 'Role',
    required: true
  },
  team: {
    type: String,
    required: false,
    trim: true,
    index: true
  },
  zone: {
    type: String,
    required: false,
    trim: true,
    index: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastLoginAt: {
    type: Date,
    required: false
  }
}, {
  timestamps: true
});

// Indexes
// ลบ index ของ phone ออกเพราะมี unique: true ใน field definition อยู่แล้ว
AdminSchema.index({ email: 1 });
AdminSchema.index({ role: 1 });
AdminSchema.index({ isActive: 1 });

// Virtual for display name
AdminSchema.virtual('displayName').get(function() {
  return `${this.name} (${this.phone})`;
});

// Ensure virtual fields are serialized
AdminSchema.set('toJSON', { virtuals: true });
AdminSchema.set('toObject', { virtuals: true });

export default mongoose.models.Admin || mongoose.model<IAdmin>('Admin', AdminSchema);
