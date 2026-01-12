import mongoose, { Schema, Document } from 'mongoose';

export type LineCommandKey = 'greeting' | 'link_customer' | 'quotation';

export interface ILineCommand extends Document {
  key: LineCommandKey;
  name: string;
  pattern: string;
  description?: string;
  isActive: boolean;
  priority: number;
  createdAt: Date;
  updatedAt: Date;
}

const lineCommandSchema = new Schema<ILineCommand>(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      enum: ['greeting', 'link_customer', 'quotation'],
      trim: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    pattern: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 300,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    priority: {
      type: Number,
      default: 1,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.LineCommand ||
  mongoose.model<ILineCommand>('LineCommand', lineCommandSchema);
