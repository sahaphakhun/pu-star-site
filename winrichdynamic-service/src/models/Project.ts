import mongoose, { Schema, Document, Model } from 'mongoose';

export type ProjectStatus = 'planning' | 'proposed' | 'quoted' | 'testing' | 'approved' | 'closed';

export interface IProject extends Document {
  projectCode: string; // Auto-generated: PJ#YYMMDD-XXXX
  name: string;
  type: string; // Project type (e.g., "หอพัก / คอนโดมิเนียม / ที่พักอาศัยแนวสูง")
  customerId: string; // Reference to Customer
  customerName: string; // Denormalized for performance
  tags: string[];
  importance: number; // 1-5 scale
  quotationCount: number; // Calculated field
  activityCount: number; // Calculated field
  startDate: Date;
  endDate?: Date;
  value: number; // Project value in THB
  ownerId: string; // Admin ID from token
  ownerName: string; // Denormalized for display
  team: string; // Team assignment
  status: ProjectStatus;
  description?: string;
  location?: {
    address: string;
    province: string;
    district: string;
    subdistrict: string;
    zipcode: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface IProjectModel extends Model<IProject> {
  generateUniqueProjectCode(): Promise<string>;
}

const projectSchema = new Schema<IProject>(
  {
    projectCode: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      match: [/^PJ#\d{6}-\d{4}$/, 'รหัสโปรเจคต้องอยู่ในรูปแบบ PJ#YYMMDD-XXXX'],
    },
    name: {
      type: String,
      required: [true, 'กรุณาระบุชื่อโปรเจค'],
      trim: true,
      minlength: [2, 'ชื่อโปรเจคต้องมีความยาวอย่างน้อย 2 ตัวอักษร'],
      maxlength: [200, 'ชื่อโปรเจคต้องมีความยาวไม่เกิน 200 ตัวอักษร'],
    },
    type: {
      type: String,
      required: [true, 'กรุณาระบุประเภทโปรเจค'],
      trim: true,
      maxlength: [100, 'ประเภทโปรเจคต้องมีความยาวไม่เกิน 100 ตัวอักษร'],
    },
    customerId: {
      type: String,
      required: [true, 'กรุณาระบุลูกค้า'],
      trim: true,
    },
    customerName: {
      type: String,
      required: [true, 'กรุณาระบุชื่อลูกค้า'],
      trim: true,
      maxlength: [200, 'ชื่อลูกค้าต้องมีความยาวไม่เกิน 200 ตัวอักษร'],
    },
    tags: {
      type: [String],
      default: [],
    },
    importance: {
      type: Number,
      required: true,
      min: [1, 'ความสำคัญต้องอยู่ระหว่าง 1-5'],
      max: [5, 'ความสำคัญต้องอยู่ระหว่าง 1-5'],
      default: 3,
    },
    quotationCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    activityCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    startDate: {
      type: Date,
      required: [true, 'กรุณาระบุวันที่เริ่มต้น'],
    },
    endDate: {
      type: Date,
      validate: {
        validator: function (this: IProject, value: Date) {
          return !value || value >= this.startDate;
        },
        message: 'วันที่สิ้นสุดต้องมาหลังวันที่เริ่มต้น'
      }
    },
    value: {
      type: Number,
      required: [true, 'กรุณาระบุมูลค่าโปรเจค'],
      min: [0, 'มูลค่าโปรเจคต้องไม่ต่ำกว่า 0'],
    },
    ownerId: {
      type: String,
      required: [true, 'กรุณาระบุผู้รับผิดชอบ'],
      trim: true,
    },
    ownerName: {
      type: String,
      required: [true, 'กรุณาระบุชื่อผู้รับผิดชอบ'],
      trim: true,
      maxlength: [100, 'ชื่อผู้รับผิดชอบต้องมีความยาวไม่เกิน 100 ตัวอักษร'],
    },
    team: {
      type: String,
      required: [true, 'กรุณาระบุทีม'],
      trim: true,
      maxlength: [100, 'ชื่อทีมต้องมีความยาวไม่เกิน 100 ตัวอักษร'],
    },
    status: {
      type: String,
      enum: ['planning', 'proposed', 'quoted', 'testing', 'approved', 'closed'],
      default: 'planning',
    },
    description: {
      type: String,
      trim: true,
      maxlength: [2000, 'รายละเอียดต้องมีความยาวไม่เกิน 2000 ตัวอักษร'],
    },
    location: {
      address: {
        type: String,
        trim: true,
        maxlength: [500, 'ที่อยู่ต้องมีความยาวไม่เกิน 500 ตัวอักษร'],
      },
      province: {
        type: String,
        trim: true,
        maxlength: [100, 'จังหวัดต้องมีความยาวไม่เกิน 100 ตัวอักษร'],
      },
      district: {
        type: String,
        trim: true,
        maxlength: [100, 'อำเภอ/เขตต้องมีความยาวไม่เกิน 100 ตัวอักษร'],
      },
      subdistrict: {
        type: String,
        trim: true,
        maxlength: [100, 'ตำบล/แขวงต้องมีความยาวไม่เกิน 100 ตัวอักษร'],
      },
      zipcode: {
        type: String,
        trim: true,
        match: [/^\d{5}$/, 'รหัสไปรษณีย์ต้องเป็นตัวเลข 5 หลัก'],
      },
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Create indexes for performance
projectSchema.index({ name: 'text', customerName: 'text', tags: 'text' });
// projectCode already has unique: true which creates an index automatically
projectSchema.index({ customerId: 1 });
projectSchema.index({ ownerId: 1 });
projectSchema.index({ team: 1 });
projectSchema.index({ status: 1 });
projectSchema.index({ importance: 1 });
projectSchema.index({ startDate: -1 });
projectSchema.index({ createdAt: -1 });
projectSchema.index({ updatedAt: -1 });

// Virtual field for project duration in days
projectSchema.virtual('durationDays').get(function () {
  if (!this.endDate) return null;
  const diffTime = Math.abs(this.endDate.getTime() - this.startDate.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// Virtual field for project status in Thai
projectSchema.virtual('statusThai').get(function () {
  const statusMap = {
    planning: 'วางแผน',
    proposed: 'เสนอ',
    quoted: 'เสนอราคา',
    testing: 'ทดสอบ',
    approved: 'อนุมัติ',
    closed: 'ปิดโปรเจค'
  };
  return statusMap[this.status as keyof typeof statusMap] || this.status;
});

// Function to generate unique project code
async function generateUniqueProjectCode(): Promise<string> {
  const today = new Date();
  const dateStr = today.toISOString().slice(2, 10).replace(/-/g, ''); // YYMMDD format

  // Try to generate a unique code with random 4-digit suffix
  for (let attempt = 0; attempt < 20; attempt++) {
    const randomSuffix = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    const code = `PJ#${dateStr}-${randomSuffix}`;

    // Check if code already exists
    const exists = await (mongoose.models.Project as any).exists({ projectCode: code });
    if (!exists) {
      return code;
    }
  }

  // Fallback: increment suffix if random generation fails
  for (let i = 0; i < 10000; i++) {
    const suffix = i.toString().padStart(4, '0');
    const code = `PJ#${dateStr}-${suffix}`;
    const exists = await (mongoose.models.Project as any).exists({ projectCode: code });
    if (!exists) {
      return code;
    }
  }

  throw new Error('ไม่สามารถสร้างรหัสโปรเจคที่ไม่ซ้ำได้');
}

// Pre-save hook to generate project code
projectSchema.pre('save', async function (next) {
  try {
    if (!this.isNew) return next();
    const doc: any = this;
    if (!doc.projectCode) {
      doc.projectCode = await generateUniqueProjectCode();
    }
    next();
  } catch (err) {
    next(err as any);
  }
});

// Attach static method to model
(projectSchema.statics as any).generateUniqueProjectCode = generateUniqueProjectCode;

// Create and export the model
const ProjectModel = (mongoose.models.Project as IProjectModel) || mongoose.model<IProject, IProjectModel>('Project', projectSchema);
export default ProjectModel;