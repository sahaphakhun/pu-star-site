import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ICustomer extends Document {
  name: string;
  phoneNumber: string;
  email?: string;
  taxId?: string;
  companyName?: string;
  companyAddress?: string;
  province?: string;
  district?: string;
  subdistrict?: string;
  zipcode?: string;
  registeredProvince?: string;
  registeredDistrict?: string;
  registeredSubdistrict?: string;
  registeredZipcode?: string;
  companyPhone?: string;
  companyEmail?: string;
  shippingAddress?: string;
  shippingSameAsCompany?: boolean;
  customerCode?: string;
  customerType: 'new' | 'regular' | 'target' | 'inactive';
  assignedTo?: string;
  creditLimit?: number;
  paymentTerms?: string;
  notes?: string;
  tags?: string[];
  priorityStar?: number; // 0-5 ดาว
  goals?: string; // เป้าหมายของลูกค้า (สรุปสั้น)
  authorizedPhones?: string[]; // เบอร์ที่อนุญาตล็อกอินด้วย customerCode
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  
  // สถานะการขาย
  status?: 'planning' | 'proposed' | 'quoted' | 'testing' | 'approved' | 'closed';
  
  // ข้อมูลสำหรับสถานะ "นำเสนอสินค้า"
  companyPhoto?: string; // รูปหน้าร้าน
  storeDetails?: string; // รายละเอียดร้านค้า
  salesOpportunities?: Array<{
    productId: string;
    productName: string;
    competitorPrice?: number;
    competitorBrand?: string;
  }>;
  futureProducts?: Array<{
    productName: string;
    details: string;
  }>;
  
  // ข้อมูลสำหรับสถานะ "เสนอราคา"
  quotationHistory?: Array<{
    quotationId: string;
    date: Date;
    amount: number;
    status: string;
  }>;
  newQuotationReason?: string;
  
  // ข้อมูลสำหรับสถานะ "ทดสอบตัวอย่างสินค้า"
  sampleRequestHistory?: Array<{
    requestId: string;
    date: Date;
    items: Array<{
      productId: string;
      productName: string;
      quantity: number;
    }>;
    status: string;
    testImages?: string[];
  }>;
  sampleReceipt?: {
    companyCopy?: string; // ใบรับสินค้าตัวอย่างฉบับบริษัท
    customerCopy?: string; // ใบรับสินค้าตัวอย่างฉบับลูกค้า
  };
  
  // ข้อมูลสำหรับสถานะ "อนุมัติราคา"
  creditApproval?: {
    requestedAmount?: number;
    paymentPeriod?: string;
    reason?: string;
    responsiblePerson?: string;
    documents?: Array<{
      type: string;
      url: string;
      name: string;
    }>;
    creditLimit?: number;
    creditStartDate?: Date;
    status?: 'pending' | 'approved' | 'rejected';
  };
}

export interface ICustomerModel extends Model<ICustomer> {
  generateUniqueCustomerCode(): Promise<string>;
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
    province: {
      type: String,
      required: false,
      trim: true,
      maxlength: [100, 'จังหวัดต้องมีความยาวไม่เกิน 100 ตัวอักษร'],
    },
    district: {
      type: String,
      required: false,
      trim: true,
      maxlength: [100, 'อำเภอ/เขตต้องมีความยาวไม่เกิน 100 ตัวอักษร'],
    },
    subdistrict: {
      type: String,
      required: false,
      trim: true,
      maxlength: [100, 'ตำบล/แขวงต้องมีความยาวไม่เกิน 100 ตัวอักษร'],
    },
    zipcode: {
      type: String,
      required: false,
      trim: true,
      match: [/^\d{5}$/, 'รหัสไปรษณีย์ต้องเป็นตัวเลข 5 หลัก'],
    },
    registeredProvince: {
      type: String,
      required: false,
      trim: true,
      maxlength: [100, 'จังหวัดต้องมีความยาวไม่เกิน 100 ตัวอักษร'],
    },
    registeredDistrict: {
      type: String,
      required: false,
      trim: true,
      maxlength: [100, 'อำเภอ/เขตต้องมีความยาวไม่เกิน 100 ตัวอักษร'],
    },
    registeredSubdistrict: {
      type: String,
      required: false,
      trim: true,
      maxlength: [100, 'ตำบล/แขวงต้องมีความยาวไม่เกิน 100 ตัวอักษร'],
    },
    registeredZipcode: {
      type: String,
      required: false,
      trim: true,
      match: [/^\d{5}$/, 'รหัสไปรษณีย์ต้องเป็นตัวเลข 5 หลัก'],
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
    shippingAddress: {
      type: String,
      required: false,
      trim: true,
      maxlength: [500, 'ที่อยู่จัดส่งต้องมีความยาวไม่เกิน 500 ตัวอักษร'],
    },
    shippingSameAsCompany: {
      type: Boolean,
      default: false,
    },
    customerCode: {
      type: String,
      required: false,
      unique: true,
      sparse: true,
      trim: true,
      match: [/^(C\d{8}|[A-Z]\d[A-Z]\d)$/, 'รหัสลูกค้าต้องอยู่ในรูปแบบ CYYMMXXXX หรือ A1B2'],
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
    tags: {
      type: [String],
      default: [],
    },
    priorityStar: {
      type: Number,
      min: 0,
      max: 5,
      default: 0,
    },
    goals: {
      type: String,
      required: false,
      trim: true,
      maxlength: [2000, 'เป้าหมายต้องไม่เกิน 2000 ตัวอักษร'],
    },
    authorizedPhones: {
      type: [String],
      default: [],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    
    // สถานะการขาย
    status: {
      type: String,
      enum: ['planning', 'proposed', 'quoted', 'testing', 'approved', 'closed'],
      default: 'planning',
    },
    
    // ข้อมูลสำหรับสถานะ "นำเสนอสินค้า"
    companyPhoto: {
      type: String,
      required: false,
    },
    storeDetails: {
      type: String,
      required: false,
      maxlength: [1000, 'รายละเอียดร้านค้าต้องมีความยาวไม่เกิน 1000 ตัวอักษร'],
    },
    salesOpportunities: [{
      productId: {
        type: String,
        required: false,
      },
      productName: {
        type: String,
        required: false,
      },
      competitorPrice: {
        type: Number,
        required: false,
      },
      competitorBrand: {
        type: String,
        required: false,
      },
    }],
    futureProducts: [{
      productName: {
        type: String,
        required: false,
      },
      details: {
        type: String,
        required: false,
      },
    }],
    
    // ข้อมูลสำหรับสถานะ "เสนอราคา"
    quotationHistory: [{
      quotationId: {
        type: String,
        required: false,
      },
      date: {
        type: Date,
        required: false,
      },
      amount: {
        type: Number,
        required: false,
      },
      status: {
        type: String,
        required: false,
      },
    }],
    newQuotationReason: {
      type: String,
      required: false,
      maxlength: [500, 'เหตุผลการสร้างใบเสนอราคาใหม่ต้องมีความยาวไม่เกิน 500 ตัวอักษร'],
    },
    
    // ข้อมูลสำหรับสถานะ "ทดสอบตัวอย่างสินค้า"
    sampleRequestHistory: [{
      requestId: {
        type: String,
        required: false,
      },
      date: {
        type: Date,
        required: false,
      },
      items: [{
        productId: {
          type: String,
          required: false,
        },
        productName: {
          type: String,
          required: false,
        },
        quantity: {
          type: Number,
          required: false,
        },
      }],
      status: {
        type: String,
        required: false,
      },
      testImages: [String],
    }],
    sampleReceipt: {
      companyCopy: {
        type: String,
        required: false,
      },
      customerCopy: {
        type: String,
        required: false,
      },
    },
    
    // ข้อมูลสำหรับสถานะ "อนุมัติราคา"
    creditApproval: {
      requestedAmount: {
        type: Number,
        required: false,
      },
      paymentPeriod: {
        type: String,
        required: false,
      },
      reason: {
        type: String,
        required: false,
      },
      responsiblePerson: {
        type: String,
        required: false,
      },
      documents: [{
        type: {
          type: String,
          required: false,
        },
        url: {
          type: String,
          required: false,
        },
        name: {
          type: String,
          required: false,
        },
      }],
      creditLimit: {
        type: Number,
        required: false,
      },
      creditStartDate: {
        type: Date,
        required: false,
      },
      status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending',
      },
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// สร้าง Indexes สำหรับการค้นหา
customerSchema.index({ name: 'text', taxId: 'text' }); // ลบ phoneNumber ออกจาก text index
customerSchema.index({ phoneNumber: 1 }); // เพิ่ม index แยกสำหรับ phoneNumber
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

const CUSTOMER_CODE_PREFIX = 'C';
const CUSTOMER_CODE_SEQUENCE_DIGITS = 4;

const buildCustomerCodePrefix = (date: Date = new Date()) => {
  const year = String(date.getFullYear()).slice(-2);
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${CUSTOMER_CODE_PREFIX}${year}${month}`;
};

// สร้างรหัสลูกค้าแบบรันต่อรายเดือน (รูปแบบ CYYMMXXXX)
async function generateUniqueCustomerCode(date: Date = new Date()): Promise<string> {
  const prefix = buildCustomerCodePrefix(date);
  const prefixLength = prefix.length;
  const regex = new RegExp(`^${prefix}\\d{${CUSTOMER_CODE_SEQUENCE_DIGITS}}$`, 'i');

  const latest = await (mongoose.models.Customer as any).aggregate([
    { $match: { customerCode: { $regex: regex } } },
    {
      $addFields: {
        codeNumber: {
          $toInt: {
            $substrBytes: [
              '$customerCode',
              prefixLength,
              CUSTOMER_CODE_SEQUENCE_DIGITS,
            ],
          },
        },
      },
    },
    { $sort: { codeNumber: -1 } },
    { $limit: 1 },
    { $project: { customerCode: 1, codeNumber: 1 } },
  ]);

  const latestNumber = Number(latest?.[0]?.codeNumber || 0);
  const nextNumber = latestNumber + 1;

  for (let attempt = 0; attempt < 20; attempt++) {
    const code = `${prefix}${String(nextNumber + attempt).padStart(CUSTOMER_CODE_SEQUENCE_DIGITS, '0')}`;
    const exists = await (mongoose.models.Customer as any).exists({ customerCode: code });
    if (!exists) {
      return code;
    }
  }

  throw new Error('ไม่สามารถสร้างรหัสลูกค้าที่ไม่ซ้ำได้');
}

// สร้างรหัสลูกค้าอัตโนมัติเฉพาะเมื่อเอกสารยังไม่มีค่าเท่านั้น
customerSchema.pre('save', async function(next) {
  try {
    if (!this.isNew) return next();
    const doc: any = this;
    if (!doc.customerCode) {
      doc.customerCode = await generateUniqueCustomerCode();
    }
    next();
  } catch (err) {
    next(err as any);
  }
});

// ผูก static method เข้ากับโมเดล
(customerSchema.statics as any).generateUniqueCustomerCode = generateUniqueCustomerCode;

// ต้องประกาศ model หลังจากกำหนด hooks และ statics ทั้งหมด
const CustomerModel = (mongoose.models.Customer as ICustomerModel) || mongoose.model<ICustomer, ICustomerModel>('Customer', customerSchema);
export default CustomerModel;
