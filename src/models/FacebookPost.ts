import mongoose, { Schema, Document } from 'mongoose';

export interface IFacebookPost extends Document {
  postId: string; // Facebook Post ID
  message: string; // เนื้อหาโพสต์
  postType: 'status' | 'photo' | 'video' | 'link';
  attachments?: any[];
  permalink: string;
  createdTime: Date;
  
  // Automation Settings
  automation: {
    enabled: boolean;
    
    // Comment Reply
    commentReply: {
      enabled: boolean;
      replyText?: string; // ข้อความตอบกลับคอมเมนต์
    };
    
    // Private Message
    privateMessage: {
      enabled: boolean;
      messageText: string; // ข้อความส่วนตัวที่จะส่งไป
    };
    
    // AI Settings
    aiInstructions?: string; // คำสั่งพิเศษสำหรับ AI
    aiContext?: string; // บริบทเพิ่มเติมสำหรับ AI
  };
  
  // Statistics
  stats: {
    commentsCount: number;
    messagesCount: number;
    lastTriggeredAt?: Date;
  };
  
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const facebookPostSchema = new Schema<IFacebookPost>(
  {
    postId: { type: String, required: true, unique: true, index: true },
    message: { type: String, required: true },
    postType: {
      type: String,
      enum: ['status', 'photo', 'video', 'link'],
      default: 'status',
    },
    attachments: [{ type: Schema.Types.Mixed }],
    permalink: { type: String },
    createdTime: { type: Date, required: true },
    
    automation: {
      enabled: { type: Boolean, default: false },
      
      commentReply: {
        enabled: { type: Boolean, default: false },
        replyText: { type: String },
      },
      
      privateMessage: {
        enabled: { type: Boolean, default: false },
        messageText: { type: String },
      },
      
      aiInstructions: { type: String },
      aiContext: { type: String },
    },
    
    stats: {
      commentsCount: { type: Number, default: 0 },
      messagesCount: { type: Number, default: 0 },
      lastTriggeredAt: { type: Date },
    },
    
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// Indexes
facebookPostSchema.index({ postId: 1 });
facebookPostSchema.index({ isActive: 1, createdTime: -1 });
facebookPostSchema.index({ 'automation.enabled': 1 });

export default
  mongoose.models.FacebookPost ||
  mongoose.model<IFacebookPost>('FacebookPost', facebookPostSchema);

