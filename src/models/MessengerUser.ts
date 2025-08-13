import mongoose, { Schema, Document } from 'mongoose';

export interface IMessengerUser extends Document {
  psid: string;
  phoneNumber?: string;
  userId?: Schema.Types.ObjectId;
  otpToken?: string;
  otpExpire?: Date;
  aiEnabled: boolean; // เปิด/ปิดโหมด AI
  autoModeEnabled: boolean; // เปิด/ปิดโหมดอัตโนมัติ (เมื่อไม่กดเมนู 2 ครั้งขึ้นไป)
  conversationHistory: Array<{ role: string; content: string; timestamp: Date }>; // ประวัติการสนทนา
  createdAt: Date;
  updatedAt: Date;
}

const messengerUserSchema = new Schema<IMessengerUser>(
  {
    psid: { type: String, required: true, unique: true, index: true },
    phoneNumber: { type: String },
    userId: { type: Schema.Types.ObjectId, ref: 'User' },
    otpToken: { type: String },
    otpExpire: { type: Date },
    aiEnabled: { type: Boolean, default: false },
    autoModeEnabled: { type: Boolean, default: false },
    conversationHistory: [{
      role: { type: String, required: true, enum: ['user', 'assistant', 'system'] },
      content: { type: String, required: true },
      timestamp: { type: Date, default: Date.now }
    }],
  },
  { timestamps: true }
);

export default
  mongoose.models.MessengerUser ||
  mongoose.model<IMessengerUser>('MessengerUser', messengerUserSchema); 