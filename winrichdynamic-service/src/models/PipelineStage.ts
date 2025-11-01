import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IPipelineStage extends Document {
  name: string;
  order: number;
  color?: string;
  probability?: number; // 0-100
  isDefault?: boolean;
  isWon?: boolean;
  isLost?: boolean;
  team?: string; // สำหรับแยกทีม/โซนในอนาคต
  createdAt: Date;
  updatedAt: Date;
}

const pipelineStageSchema = new Schema<IPipelineStage>(
  {
    name: {
      type: String,
      required: [true, 'กรุณาระบุชื่อสเตจ'],
      trim: true,
      maxlength: [100, 'ชื่อสเตจต้องไม่เกิน 100 ตัวอักษร'],
    },
    order: {
      type: Number,
      required: true,
      min: [0, 'ลำดับต้องไม่ต่ำกว่า 0'],
    },
    color: {
      type: String,
      trim: true,
      default: '#64748b',
    },
    probability: {
      type: Number,
      min: [0, 'ความน่าจะเป็นต้องไม่ต่ำกว่า 0'],
      max: [100, 'ความน่าจะเป็นต้องไม่เกิน 100'],
      default: 0,
    },
    isDefault: {
      type: Boolean,
      default: false,
    },
    isWon: {
      type: Boolean,
      default: false,
    },
    isLost: {
      type: Boolean,
      default: false,
    },
    team: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

pipelineStageSchema.index({ name: 1 }, { unique: false });
pipelineStageSchema.index({ order: 1 });
pipelineStageSchema.index({ team: 1 });

const PipelineStageModel: Model<IPipelineStage> =
  (mongoose.models.PipelineStage as Model<IPipelineStage>) ||
  mongoose.model<IPipelineStage>('PipelineStage', pipelineStageSchema);

export default PipelineStageModel;


