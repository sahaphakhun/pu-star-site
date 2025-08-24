import mongoose, { Document, Schema } from 'mongoose';

export interface ISettings extends Document {
  companyName: string;
  companyAddress: string;
  companyPhone: string;
  companyEmail: string;
  companyTaxId: string;
  quotationPrefix: string;
  quotationValidityDays: number;
  defaultVatRate: number;
  defaultPaymentTerms: string;
  defaultDeliveryTerms: string;
  emailSettings: {
    smtpHost: string;
    smtpPort: number;
    smtpUser: string;
    smtpPass: string;
    fromEmail: string;
    fromName: string;
  };
  notificationSettings: {
    emailNotifications: boolean;
    lineNotifications: boolean;
    lineChannelSecret: string;
    lineChannelAccessToken: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const SettingsSchema = new Schema<ISettings>({
  companyName: {
    type: String,
    required: true,
    default: 'WinRich Dynamic Co., Ltd.'
  },
  companyAddress: {
    type: String,
    required: true,
    default: '123 ถนนสุขุมวิท แขวงคลองเตย เขตคลองเตย กรุงเทพฯ 10110'
  },
  companyPhone: {
    type: String,
    required: true,
    default: '+66 2 123 4567'
  },
  companyEmail: {
    type: String,
    required: true,
    default: 'info@winrich.com'
  },
  companyTaxId: {
    type: String,
    required: true,
    default: '0123456789012'
  },
  quotationPrefix: {
    type: String,
    required: true,
    default: 'QT'
  },
  quotationValidityDays: {
    type: Number,
    required: true,
    default: 30,
    min: 1,
    max: 365
  },
  defaultVatRate: {
    type: Number,
    required: true,
    default: 7,
    min: 0,
    max: 100
  },
  defaultPaymentTerms: {
    type: String,
    required: true,
    default: 'ชำระเงินภายใน 30 วัน'
  },
  defaultDeliveryTerms: {
    type: String,
    required: true,
    default: 'จัดส่งภายใน 7 วันหลังจากยืนยันออเดอร์'
  },
  emailSettings: {
    smtpHost: {
      type: String,
      required: true,
      default: 'smtp.gmail.com'
    },
    smtpPort: {
      type: Number,
      required: true,
      default: 587
    },
    smtpUser: {
      type: String,
      required: false,
      default: ''
    },
    smtpPass: {
      type: String,
      required: false,
      default: ''
    },
    fromEmail: {
      type: String,
      required: true,
      default: 'noreply@winrich.com'
    },
    fromName: {
      type: String,
      required: true,
      default: 'WinRich Dynamic'
    }
  },
  notificationSettings: {
    emailNotifications: {
      type: Boolean,
      required: true,
      default: true
    },
    lineNotifications: {
      type: Boolean,
      required: true,
      default: false
    },
    lineChannelSecret: {
      type: String,
      required: false,
      default: ''
    },
    lineChannelAccessToken: {
      type: String,
      required: false,
      default: ''
    }
  }
}, {
  timestamps: true
});

// สร้าง index เพื่อให้มีเพียง 1 record เท่านั้น
SettingsSchema.index({}, { unique: true });

export default mongoose.models.Settings || mongoose.model<ISettings>('Settings', SettingsSchema);
