import mongoose, { Document, Schema } from 'mongoose';

export interface IPermission {
  id: string;
  name: string;
  description: string;
  category: string;
}

export interface IRole extends Document {
  name: string;
  description: string;
  level: number; // 1: SuperAdmin, 2: SalesAdmin, 3: WarehouseAdmin
  permissions: string[]; // Array ของ permission IDs
  isSystem: boolean; // เป็น system role หรือไม่ (ไม่สามารถลบได้)
  createdAt: Date;
  updatedAt: Date;
}

const RoleSchema = new Schema<IRole>({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  level: {
    type: Number,
    required: true,
    min: 1,
    max: 10
  },
  permissions: [{
    type: String,
    required: true
  }],
  isSystem: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// สร้าง index สำหรับการค้นหา
RoleSchema.index({ name: 1 });
RoleSchema.index({ level: 1 });

export default mongoose.models.Role || mongoose.model<IRole>('Role', RoleSchema);
