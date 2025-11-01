import mongoose, { Schema, Document } from 'mongoose';

export interface IFacebookComment extends Document {
  commentId: string; // Facebook Comment ID
  postId: string; // Facebook Post ID
  message: string; // เนื้อหาคอมเมนต์
  fromId: string; // Facebook User ID ของคนคอมเมนต์
  fromName: string; // ชื่อของคนคอมเมนต์
  createdTime: Date;
  
  // Automation Status
  automation: {
    commentReplied: boolean; // ตอบกลับคอมเมนต์แล้วหรือยัง
    commentReplyText?: string; // ข้อความที่ตอบกลับ
    commentRepliedAt?: Date;
    
    privateMessageSent: boolean; // ส่งข้อความส่วนตัวแล้วหรือยัง
    privateMessageText?: string; // ข้อความส่วนตัวที่ส่งไป
    privateMessageSentAt?: Date;
    
    psid?: string; // PSID ของผู้ใช้ (ถ้าส่งข้อความส่วนตัว)
  };
  
  createdAt: Date;
  updatedAt: Date;
}

const facebookCommentSchema = new Schema<IFacebookComment>(
  {
    commentId: { type: String, required: true, unique: true, index: true },
    postId: { type: String, required: true, index: true },
    message: { type: String, required: true },
    fromId: { type: String, required: true },
    fromName: { type: String, required: true },
    createdTime: { type: Date, required: true },
    
    automation: {
      commentReplied: { type: Boolean, default: false },
      commentReplyText: { type: String },
      commentRepliedAt: { type: Date },
      
      privateMessageSent: { type: Boolean, default: false },
      privateMessageText: { type: String },
      privateMessageSentAt: { type: Date },
      
      psid: { type: String },
    },
  },
  { timestamps: true }
);

// Indexes
facebookCommentSchema.index({ commentId: 1 });
facebookCommentSchema.index({ postId: 1, createdTime: -1 });
facebookCommentSchema.index({ fromId: 1 });
facebookCommentSchema.index({ 'automation.psid': 1 });

export default
  mongoose.models.FacebookComment ||
  mongoose.model<IFacebookComment>('FacebookComment', facebookCommentSchema);

