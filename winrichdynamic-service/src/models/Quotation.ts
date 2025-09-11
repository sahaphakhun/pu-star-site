import mongoose, { Schema, Document } from 'mongoose';
import { round2, computeVatIncluded, computeLineTotal } from '@/utils/number';

export interface IQuotationItem {
  productId: string;
  productName: string;
  description?: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  discount: number; // ส่วนลดเป็นเปอร์เซ็นต์
  totalPrice: number; // ราคารวมหลังหักส่วนลด
}

export interface IQuotation extends Document {
  quotationNumber: string; // เลขที่ใบเสนอราคา (อัตโนมัติ)
  customerId: string; // อ้างอิงไปยัง Customer
  customerName: string; // ชื่อลูกค้า (เก็บไว้เพื่อความเร็ว)
  customerTaxId?: string; // เลขประจำตัวผู้เสียภาษี
  customerAddress?: string; // ที่อยู่ลูกค้า
  customerPhone?: string; // เบอร์โทรลูกค้า
  
  // ข้อมูลใบเสนอราคา
  subject: string; // หัวข้อใบเสนอราคา
  validUntil: Date; // วันหมดอายุ
  paymentTerms: string; // เงื่อนไขการชำระเงิน
  deliveryTerms?: string; // เงื่อนไขการส่งมอบ
  
  // รายการสินค้า
  items: IQuotationItem[];
  
  // การคำนวณราคา
  subtotal: number; // ราคารวมก่อนหักส่วนลด
  totalDiscount: number; // ส่วนลดรวม
  totalAmount: number; // ราคารวมหลังหักส่วนลด
  vatRate: number; // อัตราภาษีมูลค่าเพิ่ม
  vatAmount: number; // ภาษีมูลค่าเพิ่ม
  grandTotal: number; // ราคารวมทั้งสิ้น
  
  // สถานะและผู้รับผิดชอบ
  status: 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired';
  assignedTo?: string; // ผู้รับผิดชอบ
  notes?: string; // หมายเหตุ
  
  // ข้อมูลการส่ง
  sentAt?: Date; // วันที่ส่ง
  sentBy?: string; // ผู้ส่ง
  sentMethod?: 'email' | 'line' | 'manual'; // วิธีการส่ง
  
  // ข้อมูลการตอบกลับ
  respondedAt?: Date; // วันที่ลูกค้าตอบกลับ
  responseNotes?: string; // หมายเหตุการตอบกลับ
  
  // ข้อมูลการแปลงเป็น Sales Order
  convertedToOrder?: string; // ID ของ Sales Order ที่แปลงจากใบเสนอราคานี้
  // สถานะการออกใบสั่งขาย
  salesOrderIssued?: boolean;
  salesOrderNumber?: string;
  salesOrderIssuedAt?: Date;
  // ประวัติการแก้ไข
  editHistory?: Array<{
    editedAt: Date;
    editedBy?: string;
    remark: string;
    changedFields?: string[];
  }>;
  
  createdAt: Date;
  updatedAt: Date;
}

const quotationItemSchema = new Schema<IQuotationItem>({
  productId: {
    type: String,
    required: [true, 'กรุณาระบุรหัสสินค้า'],
    trim: true,
  },
  productName: {
    type: String,
    required: [true, 'กรุณาระบุชื่อสินค้า'],
    trim: true,
    maxlength: [200, 'ชื่อสินค้าต้องมีความยาวไม่เกิน 200 ตัวอักษร'],
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'รายละเอียดสินค้าต้องมีความยาวไม่เกิน 500 ตัวอักษร'],
  },
  quantity: {
    type: Number,
    required: [true, 'กรุณาระบุจำนวน'],
    min: [0.01, 'จำนวนต้องมากกว่า 0'],
  },
  unit: {
    type: String,
    required: [true, 'กรุณาระบุหน่วย'],
    trim: true,
    maxlength: [20, 'หน่วยต้องมีความยาวไม่เกิน 20 ตัวอักษร'],
  },
  unitPrice: {
    type: Number,
    required: [true, 'กรุณาระบุราคาต่อหน่วย'],
    min: [0, 'ราคาต่อหน่วยต้องไม่ต่ำกว่า 0'],
  },
  discount: {
    type: Number,
    default: 0,
    min: [0, 'ส่วนลดต้องไม่ต่ำกว่า 0'],
    max: [100, 'ส่วนลดต้องไม่เกิน 100%'],
  },
  totalPrice: {
    type: Number,
    required: [true, 'กรุณาระบุราคารวม'],
    min: [0, 'ราคารวมต้องไม่ต่ำกว่า 0'],
  },
});

const quotationSchema = new Schema<IQuotation>(
  {
    quotationNumber: {
      type: String,
      required: [true, 'กรุณาระบุเลขที่ใบเสนอราคา'],
      trim: true,
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
    customerTaxId: {
      type: String,
      trim: true,
      match: [
        /^\d{13}$/,
        'เลขประจำตัวผู้เสียภาษีต้องเป็นตัวเลข 13 หลัก',
      ],
    },
    customerAddress: {
      type: String,
      trim: true,
      maxlength: [500, 'ที่อยู่ลูกค้าต้องมีความยาวไม่เกิน 500 ตัวอักษร'],
    },
    customerPhone: {
      type: String,
      trim: true,
      match: [
        /^(\+?66|0)\d{9}$/,
        'รูปแบบเบอร์โทรศัพท์ลูกค้าไม่ถูกต้อง (ตัวอย่าง: 0812345678, +66812345678)',
      ],
    },
    subject: {
      type: String,
      required: [true, 'กรุณาระบุหัวข้อใบเสนอราคา'],
      trim: true,
      maxlength: [200, 'หัวข้อใบเสนอราคาต้องมีความยาวไม่เกิน 200 ตัวอักษร'],
    },
    validUntil: {
      type: Date,
      required: [true, 'กรุณาระบุวันหมดอายุ'],
    },
    paymentTerms: {
      type: String,
      required: [true, 'กรุณาระบุเงื่อนไขการชำระเงิน'],
      trim: true,
      maxlength: [200, 'เงื่อนไขการชำระเงินต้องมีความยาวไม่เกิน 200 ตัวอักษร'],
      default: 'ชำระเงินทันที',
    },
    deliveryTerms: {
      type: String,
      trim: true,
      maxlength: [200, 'เงื่อนไขการส่งมอบต้องมีความยาวไม่เกิน 200 ตัวอักษร'],
    },
    items: {
      type: [quotationItemSchema],
      required: [true, 'กรุณาระบุรายการสินค้า'],
      validate: [
        (items: IQuotationItem[]) => items.length > 0,
        'ต้องมีรายการสินค้าอย่างน้อย 1 รายการ',
      ],
    },
    subtotal: {
      type: Number,
      required: [true, 'กรุณาระบุราคารวมก่อนหักส่วนลด'],
      min: [0, 'ราคารวมก่อนหักส่วนลดต้องไม่ต่ำกว่า 0'],
    },
    totalDiscount: {
      type: Number,
      default: 0,
      min: [0, 'ส่วนลดรวมต้องไม่ต่ำกว่า 0'],
    },
    totalAmount: {
      type: Number,
      required: [true, 'กรุณาระบุราคารวมหลังหักส่วนลด'],
      min: [0, 'ราคารวมหลังหักส่วนลดต้องไม่ต่ำกว่า 0'],
    },
    vatRate: {
      type: Number,
      default: 7,
      min: [0, 'อัตราภาษีมูลค่าเพิ่มต้องไม่ต่ำกว่า 0'],
      max: [100, 'อัตราภาษีมูลค่าเพิ่มต้องไม่เกิน 100'],
    },
    vatAmount: {
      type: Number,
      default: 0,
      min: [0, 'ภาษีมูลค่าเพิ่มต้องไม่ต่ำกว่า 0'],
    },
    grandTotal: {
      type: Number,
      required: [true, 'กรุณาระบุราคารวมทั้งสิ้น'],
      min: [0, 'ราคารวมทั้งสิ้นต้องไม่ต่ำกว่า 0'],
    },
    status: {
      type: String,
      enum: ['draft', 'sent', 'accepted', 'rejected', 'expired'],
      default: 'draft',
    },
    assignedTo: {
      type: String,
      trim: true,
      maxlength: [100, 'ชื่อผู้รับผิดชอบต้องมีความยาวไม่เกิน 100 ตัวอักษร'],
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [1000, 'หมายเหตุต้องมีความยาวไม่เกิน 1000 ตัวอักษร'],
    },
    sentAt: {
      type: Date,
    },
    sentBy: {
      type: String,
      trim: true,
      maxlength: [100, 'ชื่อผู้ส่งต้องมีความยาวไม่เกิน 100 ตัวอักษร'],
    },
    sentMethod: {
      type: String,
      enum: ['email', 'line', 'manual'],
    },
    respondedAt: {
      type: Date,
    },
    responseNotes: {
      type: String,
      trim: true,
      maxlength: [1000, 'หมายเหตุการตอบกลับต้องมีความยาวไม่เกิน 1000 ตัวอักษร'],
    },
    convertedToOrder: {
      type: String,
      trim: true,
    },
    salesOrderIssued: {
      type: Boolean,
      default: false,
      index: true,
    },
    salesOrderNumber: {
      type: String,
      trim: true,
      index: true,
    },
    salesOrderIssuedAt: {
      type: Date,
      index: true,
    },
    editHistory: {
      type: [
        new Schema(
          {
            editedAt: { type: Date, required: true },
            editedBy: { type: String, trim: true },
            remark: { type: String, required: true, trim: true, maxlength: 1000 },
            changedFields: { type: [String], default: [] },
          },
          { _id: false }
        )
      ],
      default: [],
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// สร้าง Indexes สำหรับการค้นหา
quotationSchema.index({ quotationNumber: 1 });
quotationSchema.index({ customerId: 1 });
quotationSchema.index({ customerName: 'text', subject: 'text' });
quotationSchema.index({ status: 1 });
quotationSchema.index({ assignedTo: 1 });
quotationSchema.index({ validUntil: 1 });
quotationSchema.index({ createdAt: -1 });

// Virtual field สำหรับสถานะที่อ่านได้
quotationSchema.virtual('statusLabel').get(function() {
  const statusLabels = {
    draft: 'ร่าง',
    sent: 'ส่งแล้ว',
    accepted: 'ยอมรับ',
    rejected: 'ปฏิเสธ',
    expired: 'หมดอายุ',
  };
  return statusLabels[this.status] || this.status;
});

// Virtual field สำหรับจำนวนวันที่เหลือ
quotationSchema.virtual('daysUntilExpiry').get(function() {
  if (!this.validUntil) return null;
  const now = new Date();
  const expiry = new Date(this.validUntil);
  const diffTime = expiry.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
});

// Virtual field สำหรับสถานะการหมดอายุ
quotationSchema.virtual('isExpired').get(function() {
  if (!this.validUntil) return false;
  return new Date() > new Date(this.validUntil);
});

// Pre-save middleware สำหรับการคำนวณราคา (VAT รวมอยู่ในราคาแล้ว)
quotationSchema.pre('save', function(next) {
  // คำนวณ subtotal แบบเสถียร
  const subtotalRaw = this.items.reduce((sum: number, item: any) => {
    return sum + (item.quantity * item.unitPrice);
  }, 0);
  this.subtotal = round2(subtotalRaw);
  
  // คำนวณ totalDiscount แบบเสถียร
  const totalDiscountRaw = this.items.reduce((sum: number, item: any) => {
    const itemGross = (item.quantity * item.unitPrice);
    return sum + (itemGross * (item.discount / 100));
  }, 0);
  this.totalDiscount = round2(totalDiscountRaw);
  
  // คำนวณ totalAmount
  this.totalAmount = round2(this.subtotal - this.totalDiscount);
  
  // VAT รวมภาษี: แยกภาษีออกจาก totalAmount
  const { vatAmount } = computeVatIncluded(this.totalAmount, this.vatRate || 7);
  this.vatAmount = round2(vatAmount);
  
  // ราคารวมทั้งสิ้นเท่ากับ totalAmount (รวม VAT แล้ว)
  this.grandTotal = this.totalAmount;
  
  // อัพเดท totalPrice ของแต่ละ item ให้เสถียร
  this.items.forEach((item: any) => {
    item.totalPrice = round2(computeLineTotal(item.quantity, item.unitPrice, item.discount));
  });
  
  next();
});

export default mongoose.models.Quotation || mongoose.model<IQuotation>('Quotation', quotationSchema);
