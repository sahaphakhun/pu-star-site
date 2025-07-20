import mongoose from 'mongoose';
import { Schema, model, models } from 'mongoose';

export interface IUser {
  name: string;
  phoneNumber: string;
  email?: string; // อีเมลเป็นตัวเลือก
  password?: string; // รหัสผ่านเป็นตัวเลือก (กรณีใช้ OTP อย่างเดียว)
  role: 'user' | 'admin';
  isVerified: boolean; // เพิ่มสถานะการยืนยันตัวตน
  profileImageUrl?: string; // รูปโปรไฟล์
  // เพิ่มฟิลด์สำหรับจัดการลูกค้า
  customerType?: 'new' | 'regular' | 'target' | 'inactive';
  assignedTo?: string; // ผู้รับผิดชอบ
  taxId?: string; // เลขผู้เสียภาษี
  lastOrderDate?: Date; // วันที่สั่งซื้อล่าสุด
  totalOrders?: number; // จำนวนออเดอร์ทั้งหมด
  totalSpent?: number; // ยอดซื้อรวมทั้งหมด
  averageOrderValue?: number; // ค่าเฉลี่ยต่อออเดอร์
  addresses?: {
    _id?: string;
    label: string;
    address: string;
    isDefault: boolean;
  }[];
  createdAt: Date;
  updatedAt: Date;
}

// กำหนดสคีมาของผู้ใช้
const userSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: false, // เปลี่ยนเป็น false เพื่อรองรับลูกค้าเก่าที่ไม่มีชื่อ
      minlength: [2, 'ชื่อผู้ใช้ต้องมีความยาวอย่างน้อย 2 ตัวอักษร'],
      maxlength: [50, 'ชื่อผู้ใช้ต้องมีความยาวไม่เกิน 50 ตัวอักษร'],
      default: 'ลูกค้า', // ค่าเริ่มต้น
    },
    phoneNumber: {
      type: String,
      required: [true, 'ต้องระบุเบอร์โทรศัพท์'],
      unique: true,
      trim: true,
      match: [
        /^\+?66\d{9}$/,
        'รูปแบบเบอร์โทรศัพท์ไม่ถูกต้อง',
      ],
    },
    email: {
      type: String,
      required: false,
      unique: true,
      sparse: true, // ให้ unique เฉพาะเมื่อมีค่า
      match: [
        /^([\w-\.]+@([\w-]+\.)+[\w-]{2,4})?$/,
        'รูปแบบอีเมลไม่ถูกต้อง',
      ],
    },
    password: {
      type: String,
      required: false,
      minlength: [6, 'รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร'],
      select: false,
    },
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    profileImageUrl: {
      type: String,
      required: false,
    },
    // เพิ่มฟิลด์สำหรับจัดการลูกค้า
    customerType: {
      type: String,
      enum: ['new', 'regular', 'target', 'inactive'],
      default: 'new',
    },
    assignedTo: {
      type: String,
      required: false,
    },
    taxId: {
      type: String,
      required: false,
    },
    lastOrderDate: {
      type: Date,
      required: false,
    },
    totalOrders: {
      type: Number,
      default: 0,
    },
    totalSpent: {
      type: Number,
      default: 0,
    },
    averageOrderValue: {
      type: Number,
      default: 0,
    },
    addresses: {
      type: [{
        _id: { type: Schema.Types.ObjectId, auto: true },
        label: { type: String, required: true },
        address: { type: String, required: true },
        isDefault: { type: Boolean, default: false }
      }],
      default: []
    },
  },
  {
    timestamps: true,
  }
);

// เพิ่มดัชนีสำหรับการค้นหา
userSchema.index({ customerType: 1 });
userSchema.index({ lastOrderDate: -1 });
userSchema.index({ totalSpent: -1 });
userSchema.index({ assignedTo: 1 });

// ตรวจสอบว่ามีโมเดลแล้วหรือไม่ เพื่อป้องกันการสร้างโมเดลซ้ำในโหมดการพัฒนา
const User = models.User || model<IUser>('User', userSchema);

export default User as mongoose.Model<IUser>; 