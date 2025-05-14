import mongoose from 'mongoose';
import { Schema, model, models } from 'mongoose';

export interface IUser {
  name: string;
  phoneNumber: string;
  email?: string; // อีเมลเป็นตัวเลือก
  password?: string; // รหัสผ่านเป็นตัวเลือก (กรณีใช้ OTP อย่างเดียว)
  role: 'user' | 'admin';
  isVerified: boolean; // เพิ่มสถานะการยืนยันตัวตน
  createdAt: Date;
  updatedAt: Date;
}

// กำหนดสคีมาของผู้ใช้
const userSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: [true, 'ต้องระบุชื่อผู้ใช้'],
      minlength: [2, 'ชื่อผู้ใช้ต้องมีความยาวอย่างน้อย 2 ตัวอักษร'],
      maxlength: [50, 'ชื่อผู้ใช้ต้องมีความยาวไม่เกิน 50 ตัวอักษร'],
    },
    phoneNumber: {
      type: String,
      required: [true, 'ต้องระบุเบอร์โทรศัพท์'],
      unique: true,
      trim: true,
      match: [
        /^(\+\d{1,3}[- ]?)?\d{9,10}$/,
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
  },
  {
    timestamps: true,
  }
);

// ตรวจสอบว่ามีโมเดลแล้วหรือไม่ เพื่อป้องกันการสร้างโมเดลซ้ำในโหมดการพัฒนา
const User = models.User || model<IUser>('User', userSchema);

export default User as mongoose.Model<IUser>; 