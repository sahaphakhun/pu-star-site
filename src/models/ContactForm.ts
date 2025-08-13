import mongoose, { Schema, Document } from 'mongoose';

export interface IContactForm extends Document {
  name: string;
  email: string;
  phone?: string;
  company?: string;
  subject: string;
  category: 'sales' | 'support' | 'partnership' | 'complaint' | 'other';
  message: string;
  status: 'new' | 'in_progress' | 'completed' | 'closed';
  adminNotes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const contactFormSchema = new Schema<IContactForm>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String },
    company: { type: String },
    subject: { type: String, required: true },
    category: { 
      type: String, 
      enum: ['sales', 'support', 'partnership', 'complaint', 'other'], 
      required: true 
    },
    message: { type: String, required: true },
    status: { 
      type: String, 
      enum: ['new', 'in_progress', 'completed', 'closed'], 
      default: 'new' 
    },
    adminNotes: { type: String },
  },
  { timestamps: true }
);

// สร้าง index สำหรับการค้นหา
contactFormSchema.index({ email: 1, createdAt: -1 });
contactFormSchema.index({ status: 1, createdAt: -1 });
contactFormSchema.index({ category: 1, createdAt: -1 });

export default mongoose.models.ContactForm ||
  mongoose.model<IContactForm>('ContactForm', contactFormSchema);
