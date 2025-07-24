import mongoose, { Schema, Document } from 'mongoose';

export interface IQuoteRequestItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  selectedOptions?: { [optionName: string]: string };
  unitLabel?: string;
  unitPrice?: number;
}

export interface IQuoteRequest extends Document {
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  items: IQuoteRequestItem[];
  totalAmount: number;
  status: 'pending' | 'quoted' | 'approved' | 'rejected';
  requestDate: Date;
  quoteMessage?: string; // ข้อความตอบกลับจากแอดมิน
  quoteFileUrl?: string; // ลิงก์ไฟล์ใบเสนอราคา
  quotedBy?: Schema.Types.ObjectId; // ID ของแอดมินที่ตอบกลับ
  quotedAt?: Date; // วันที่ตอบกลับ
  taxInvoice?: {
    requestTaxInvoice: boolean;
    companyName?: string;
    taxId?: string;
    companyAddress?: string;
    companyPhone?: string;
    companyEmail?: string;
  };
  userId?: Schema.Types.ObjectId; // ID ของผู้ใช้ที่ขอ
}

const quoteRequestSchema = new Schema<IQuoteRequest>(
  {
    customerName: {
      type: String,
      required: [true, 'กรุณาระบุชื่อลูกค้า'],
      trim: true
    },
    customerPhone: {
      type: String,
      required: [true, 'กรุณาระบุเบอร์โทรศัพท์'],
      trim: true
    },
    customerAddress: {
      type: String,
      required: [true, 'กรุณาระบุที่อยู่'],
      trim: true
    },
    items: [{
      productId: {
        type: String,
        required: true
      },
      name: {
        type: String,
        required: true
      },
      price: {
        type: Number,
        required: true,
        min: 0
      },
      quantity: {
        type: Number,
        required: true,
        min: 1
      },
      selectedOptions: {
        type: Schema.Types.Mixed,
        default: undefined
      },
      unitLabel: {
        type: String,
        default: undefined
      },
      unitPrice: {
        type: Number,
        default: undefined,
        min: 0
      }
    }],
    totalAmount: {
      type: Number,
      required: true,
      min: 0
    },
    status: {
      type: String,
      enum: ['pending', 'quoted', 'approved', 'rejected'],
      default: 'pending'
    },
    requestDate: {
      type: Date,
      default: Date.now
    },
    quoteMessage: {
      type: String,
      trim: true
    },
    quoteFileUrl: {
      type: String,
      trim: true
    },
    quotedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    quotedAt: {
      type: Date
    },
    taxInvoice: {
      requestTaxInvoice: {
        type: Boolean,
        default: false
      },
      companyName: {
        type: String,
        trim: true
      },
      taxId: {
        type: String,
        trim: true
      },
      companyAddress: {
        type: String,
        trim: true
      },
      companyPhone: {
        type: String,
        trim: true
      },
      companyEmail: {
        type: String,
        trim: true
      }
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  {
    timestamps: true
  }
);

// เพิ่มดัชนีสำหรับการค้นหา
quoteRequestSchema.index({ requestDate: -1 });
quoteRequestSchema.index({ status: 1 });
quoteRequestSchema.index({ customerPhone: 1 });
quoteRequestSchema.index({ userId: 1 });

export default mongoose.models.QuoteRequest || mongoose.model<IQuoteRequest>('QuoteRequest', quoteRequestSchema); 