import mongoose, { Schema, Document, Model } from 'mongoose';

export interface INoteAttachment {
  url: string;
  name?: string;
  type?: string; // mime
}

export interface INote extends Document {
  content: string;
  attachments?: INoteAttachment[];
  customerId?: string;
  dealId?: string;
  quotationId?: string;
  ownerId?: string;
  createdAt: Date;
  updatedAt: Date;
}

const attachmentSchema = new Schema<INoteAttachment>({
  url: { type: String, required: true, trim: true },
  name: { type: String, trim: true },
  type: { type: String, trim: true },
});

const noteSchema = new Schema<INote>(
  {
    content: {
      type: String,
      required: [true, 'กรุณาระบุเนื้อหาโน้ต'],
      trim: true,
      maxlength: [5000, 'ความยาวโน้ตต้องไม่เกิน 5000 ตัวอักษร'],
    },
    attachments: {
      type: [attachmentSchema],
      default: [],
    },
    customerId: {
      type: String,
      index: true,
      trim: true,
    },
    dealId: {
      type: String,
      index: true,
      trim: true,
    },
    quotationId: {
      type: String,
      index: true,
      trim: true,
    },
    ownerId: {
      type: String,
      index: true,
      trim: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

noteSchema.index({ createdAt: -1 });

const NoteModel: Model<INote> =
  (mongoose.models.Note as Model<INote>) ||
  mongoose.model<INote>('Note', noteSchema);

export default NoteModel;


