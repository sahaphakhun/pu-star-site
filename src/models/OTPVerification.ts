import mongoose from 'mongoose';
import { Schema, model, models } from 'mongoose';

export interface IOTPVerification {
  phoneNumber: string;
  token: string;      // token จาก DeeSMSx
  ref: string;        // ref จาก DeeSMSx
  requestNo: string;  // requestNo จาก DeeSMSx
  createdAt: Date;
  expiresAt: Date;
}

const otpVerificationSchema = new Schema<IOTPVerification>({
  phoneNumber: {
    type: String,
    required: true,
    trim: true,
    match: [
      /^(\+\d{1,3}[- ]?)?\d{9,10}$/,
      'รูปแบบเบอร์โทรศัพท์ไม่ถูกต้อง',
    ],
  },
  token: {
    type: String,
    required: true,
  },
  ref: {
    type: String,
    required: true,
  },
  requestNo: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 300, // จะถูกลบอัตโนมัติหลังจาก 5 นาที (300 วินาที)
  },
  expiresAt: {
    type: Date,
    required: true,
  },
});

// สร้างดัชนีเพื่อเพิ่มประสิทธิภาพในการค้นหา
otpVerificationSchema.index({ phoneNumber: 1 });
otpVerificationSchema.index({ token: 1 });

// เพิ่มรูทีนทำความสะอาด OTP ที่หมดอายุแล้ว
otpVerificationSchema.pre('save', function (next) {
  // ตั้งเวลาหมดอายุเป็น 5 นาทีจากเวลาปัจจุบัน
  if (!this.expiresAt) {
    this.expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 นาที
  }
  next();
});

const OTPVerification = models.OTPVerification || model<IOTPVerification>('OTPVerification', otpVerificationSchema);

export default OTPVerification as mongoose.Model<IOTPVerification>; 