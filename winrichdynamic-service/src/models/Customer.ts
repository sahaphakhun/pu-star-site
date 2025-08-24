import mongoose, { Schema, Document } from 'mongoose';

export interface ICustomer extends Document {
  name: string;
  phoneNumber: string;
  email?: string;
  taxId?: string;
  companyName?: string;
  companyAddress?: string;
  companyPhone?: string;
  companyEmail?: string;
  customerType: 'new' | 'regular' | 'target' | 'inactive';
  assignedTo?: string;
  creditLimit?: number;
  paymentTerms?: string;
  notes?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const customerSchema = new Schema<ICustomer>(
  {
    name: {
      type: String,
      required: [true, 'กรุณาระบุชื่อลูกค้า'],
      trim: true,
      minlength: [2, 'ชื่อลูกค้าต้องมีความยาวอย่างน้อย 2 ตัวอักษร'],
      maxlength: [100, 'ชื่อลูกค้าต้องมีความยาวไม่เกิน 100 ตัวอักษร'],
    },
    phoneNumber: {
      type: String,
      required: [true, 'กรุณาระบุเบอร์โทรศัพท์'],
      trim: true,
      match: [
        /^\+?66\d{9}$/,
        'รูปแบบเบอร์โทรศัพท์ไม่ถูกต้อง กรุณาใช้รูปแบบ +66xxxxxxxxx หรือ 0xxxxxxxxx',
      ],
    },
    email: {
      type: String,
      required: false,
      match: [
        /^([\w-\.]+@([\w-]+\.)+[\w-]{2,4})?$/,
        'รูปแบบอีเมลไม่ถูกต้อง',
      ],
    },
    taxId: {
      type: String,
      required: false,
      trim: true,
      match: [
        /^\d{13}$/,
        'เลขประจำตัวผู้เสียภาษีต้องเป็นตัวเลข 13 หลัก',
      ],
    },
    companyName: {
      type: String,
      required: false,
      trim: true,
      maxlength: [200, 'ชื่อบริษัทต้องมีความยาวไม่เกิน 200 ตัวอักษร'],
    },
    companyAddress: {
      type: String,
      required: false,
      trim: true,
      maxlength: [500, 'ที่อยู่บริษัทต้องมีความยาวไม่เกิน 500 ตัวอักษร'],
    },
    companyPhone: {
      type: String,
      required: false,
      trim: true,
      match: [
        /^\+?66\d{9}$/,
        'รูปแบบเบอร์โทรศัพท์บริษัทไม่ถูกต้อง',
      ],
    },
    companyEmail: {
      type: String,
      required: false,
      match: [
        /^([\w-\.]+@([\w-]+\.)+[\w-]{2,4})?$/,
        'รูปแบบอีเมลบริษัทไม่ถูกต้อง',
      ],
    },
    customerType: {
      type: String,
      enum: ['new', 'regular', 'target', 'inactive'],
      default: 'new',
    },
    assignedTo: {
      type: String,
      required: false,
      trim: true,
    },
    creditLimit: {
      type: Number,
      required: false,
      min: [0, 'วงเงินเครดิตต้องไม่ต่ำกว่า 0'],
    },
    paymentTerms: {
      type: String,
      required: false,
      trim: true,
      default: 'ชำระเงินทันที',
    },
    notes: {
      type: String,
      required: false,
      trim: true,
      maxlength: [1000, 'หมายเหตุต้องมีความยาวไม่เกิน 1000 ตัวอักษร'],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// สร้าง Indexes สำหรับการค้นหา
customerSchema.index({ name: 'text', phoneNumber: 'text', taxId: 'text' });
customerSchema.index({ email: 1 }, { unique: true, sparse: true });
customerSchema.index({ taxId: 1 }, { unique: true, sparse: true });
customerSchema.index({ customerType: 1 });
customerSchema.index({ assignedTo: 1 });
customerSchema.index({ isActive: 1 });
customerSchema.index({ createdAt: -1 });

// Virtual field สำหรับชื่อเต็ม
customerSchema.virtual('fullName').get(function() {
  if (this.companyName) {
    return `${this.companyName} (${this.name})`;
  }
  return this.name;
});

// Virtual field สำหรับข้อมูลบริษัท
customerSchema.virtual('hasCompanyInfo').get(function() {
  return !!(this.companyName || this.companyAddress || this.companyPhone || this.companyEmail);
});

export default mongoose.models.Customer || mongoose.model<ICustomer>('Customer', customerSchema);
