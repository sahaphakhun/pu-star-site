import mongoose, { Schema, Document } from 'mongoose';

export interface IOTPVerification extends Document {
  phoneNumber: string;
  token: string;      // token จาก DeeSMSx
  ref: string;        // ref จาก DeeSMSx
  requestNo: string;  // requestNo จาก DeeSMSx
  createdAt: Date;
  expiresAt: Date;
}

const OTPVerificationSchema: Schema = new Schema({
  phoneNumber: {
    type: String,
    required: true,
    trim: true,
    match: [
      /^\+?66\d{9}$/,
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
  },
  expiresAt: {
    type: Date,
    required: true,
  },
});

// ลบ indexes เก่าและสร้างใหม่
OTPVerificationSchema.index({ phoneNumber: 1 });
OTPVerificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // จะลบอัตโนมัติเมื่อถึงเวลา expiresAt

// เพิ่มรูทีนทำความสะอาด OTP ที่หมดอายุแล้ว
OTPVerificationSchema.pre('save', function (next) {
  // ตั้งเวลาหมดอายุเป็น 5 นาทีจากเวลาปัจจุบัน
  if (!this.expiresAt) {
    this.expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 นาที
  }
  next();
});

// ป้องกัน Error: OverwriteModelError
export default mongoose.models.OTPVerification || mongoose.model<IOTPVerification>('OTPVerification', OTPVerificationSchema);
