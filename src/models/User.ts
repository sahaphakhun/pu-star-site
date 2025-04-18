import mongoose from 'mongoose';
import { Schema, model, models } from 'mongoose';

export interface IUser {
  name: string;
  email: string;
  password: string;
  role: 'user' | 'admin';
  createdAt: Date;
  updatedAt: Date;
}

// กำหนดสคีมาของผู้ใช้
const userSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: [true, 'ต้องระบุชื่อผู้ใช้'],
      minlength: [3, 'ชื่อผู้ใช้ต้องมีความยาวอย่างน้อย 3 ตัวอักษร'],
      maxlength: [50, 'ชื่อผู้ใช้ต้องมีความยาวไม่เกิน 50 ตัวอักษร'],
    },
    email: {
      type: String,
      required: [true, 'ต้องระบุอีเมล'],
      unique: true,
      match: [
        /^([\w-\.]+@([\w-]+\.)+[\w-]{2,4})?$/,
        'รูปแบบอีเมลไม่ถูกต้อง',
      ],
    },
    password: {
      type: String,
      required: [true, 'ต้องระบุรหัสผ่าน'],
      minlength: [6, 'รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร'],
      select: false,
    },
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
    },
  },
  {
    timestamps: true,
  }
);

// ตรวจสอบว่ามีโมเดลแล้วหรือไม่ เพื่อป้องกันการสร้างโมเดลซ้ำในโหมดการพัฒนา
const User = models.User || model<IUser>('User', userSchema);

export default User as mongoose.Model<IUser>; 