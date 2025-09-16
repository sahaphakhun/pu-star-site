import mongoose, { Schema, Document } from 'mongoose';

export interface IMessengerUser extends Document {
  psid: string;
  phoneNumber?: string;
  userId?: Schema.Types.ObjectId;
  otpToken?: string;
  otpExpire?: Date;
  aiEnabled: boolean; // เปิด/ปิดโหมด AI
  autoModeEnabled: boolean; // เปิด/ปิดโหมดอัตโนมัติ (เมื่อไม่กดเมนู 2 ครั้งขึ้นไป)
  filterDisabled: boolean; // เปิด/ปิดการกรองข้อความ (true = ไม่กรอง, false = กรอง)
  conversationHistory: Array<{ role: string; content: any; timestamp: Date }>; // ประวัติการสนทนา (รองรับข้อความหรือมัลติมีเดีย)
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
    filterDisabled: { type: Boolean, default: false },
    conversationHistory: [{
      role: { type: String, required: true, enum: ['user', 'assistant', 'system'] },
      // เก็บได้ทั้ง string และโครงสร้าง array ของ multimodal (เช่น [{type:'text'},{type:'image_url',...}])
      content: { type: Schema.Types.Mixed, required: true },
      timestamp: { type: Date, default: Date.now }
    }],
  },
  { timestamps: true }
);

export default
  mongoose.models.MessengerUser ||
  mongoose.model<IMessengerUser>('MessengerUser', messengerUserSchema); 
