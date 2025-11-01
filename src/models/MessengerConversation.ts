import mongoose, { Schema, Document } from 'mongoose';

export interface IMessengerConversation extends Document {
  psid: string;
  userId?: Schema.Types.ObjectId;
  messages: Array<{
    role: 'user' | 'assistant' | 'system';
    content: any; // string หรือ multimodal array
    timestamp: Date;
    messageId?: string;
    isAutoReply?: boolean; // ระบุว่าเป็นข้อความอัตโนมัติหรือไม่
    source?: {
      type: 'post_comment';
      postId: string;
      commentId: string;
      commentText: string;
      postContext: {
        message: string;
        type: string;
        attachments?: any[];
      };
      aiInstructions?: string;
      aiContext?: string;
      triggeredAt: Date;
    };
  }>;
  isActive: boolean;
  lastMessageAt: Date;
  messageCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const messengerConversationSchema = new Schema<IMessengerConversation>(
  {
    psid: { type: String, required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User' },
    messages: [
      {
        role: {
          type: String,
          required: true,
          enum: ['user', 'assistant', 'system'],
        },
        content: { type: Schema.Types.Mixed, required: true },
        timestamp: { type: Date, default: Date.now },
        messageId: { type: String },
        isAutoReply: { type: Boolean, default: false },
        source: {
          type: {
            type: String,
            enum: ['post_comment'],
          },
          postId: { type: String },
          commentId: { type: String },
          commentText: { type: String },
          postContext: {
            message: { type: String },
            type: { type: String },
            attachments: [{ type: Schema.Types.Mixed }],
          },
          aiInstructions: { type: String },
          aiContext: { type: String },
          triggeredAt: { type: Date },
        },
      },
    ],
    isActive: { type: Boolean, default: true },
    lastMessageAt: { type: Date, default: Date.now },
    messageCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// Indexes
messengerConversationSchema.index({ psid: 1, isActive: 1 });
messengerConversationSchema.index({ userId: 1 });
messengerConversationSchema.index({ lastMessageAt: -1 });

export default
  mongoose.models.MessengerConversation ||
  mongoose.model<IMessengerConversation>(
    'MessengerConversation',
    messengerConversationSchema
  );

