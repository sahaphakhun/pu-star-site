import mongoose, { Schema, Document } from 'mongoose';

export interface IRole extends Document {
  name: string;
  description: string;
  level: number;
  permissions: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const RoleSchema: Schema = new Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  description: {
    type: String,
    required: false,
    trim: true
  },
  level: {
    type: Number,
    required: true,
    default: 1,
    min: 1,
    max: 10
  },
  permissions: [{
    type: String,
    required: false
  }],
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Indexes
RoleSchema.index({ name: 1 });
RoleSchema.index({ level: 1 });
RoleSchema.index({ isActive: 1 });

// Virtual for display name
RoleSchema.virtual('displayName').get(function() {
  return `${this.name} (Level ${this.level})`;
});

// Ensure virtual fields are serialized
RoleSchema.set('toJSON', { virtuals: true });
RoleSchema.set('toObject', { virtuals: true });

export default mongoose.models.Role || mongoose.model<IRole>('Role', RoleSchema);
