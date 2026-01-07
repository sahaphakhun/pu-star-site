import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  name: string;
  phoneNumber: string;
  email?: string;
  role: string;
  position?: string; // ตำแหน่ง เช่น "พนักงานขาย", "ผู้จัดการ"
  signatureUrl?: string; // URL รูปลายเซ็น
  isVerified: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema: Schema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  phoneNumber: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    match: [
      /^\+?66\d{9}$/,
      'รูปแบบเบอร์โทรศัพท์ไม่ถูกต้อง',
    ],
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
    match: [
      /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
      'รูปแบบอีเมลไม่ถูกต้อง',
    ],
  },
  role: {
    type: String,
    default: 'customer',
    enum: ['customer', 'admin', 'manager'],
  },
  position: {
    type: String,
    trim: true,
  },
  signatureUrl: {
    type: String,
    trim: true,
  },
  isVerified: {
    type: Boolean,
    default: false,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
}, {
  timestamps: true,
});

// สร้าง index สำหรับการค้นหา (เฉพาะที่จำเป็น)
// ลบ index ของ phoneNumber ออกเพราะมี unique: true ใน field definition อยู่แล้ว
UserSchema.index({ email: 1 });
UserSchema.index({ role: 1 });

// ป้องกัน Error: OverwriteModelError
export default mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
