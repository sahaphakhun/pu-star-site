import mongoose from 'mongoose';

export interface ISettings {
  logoUrl?: string;
  companyName?: string;
  companyAddress?: string;
  companyPhone?: string;
  companyEmail?: string;
  companyWebsite?: string;
  taxId?: string;
  bankInfo?: {
    bankName: string;
    accountName: string;
    accountNumber: string;
    branch: string;
  };
  updatedAt: Date;
}

const settingsSchema = new mongoose.Schema<ISettings>({
  logoUrl: {
    type: String,
    required: false
  },
  companyName: {
    type: String,
    required: false,
    default: 'บริษัท วินริช ไดนามิก จำกัด'
  },
  companyAddress: {
    type: String,
    required: false,
    default: '123 ถนนสุขุมวิท แขวงคลองเตย เขตวัฒนา กรุงเทพฯ 10110'
  },
  companyPhone: {
    type: String,
    required: false,
    default: '02-123-4567'
  },
  companyEmail: {
    type: String,
    required: false,
    default: 'info@winrichdynamic.com'
  },
  companyWebsite: {
    type: String,
    required: false,
    default: 'winrichdynamic.com'
  },
  taxId: {
    type: String,
    required: false,
    default: '0105563000000'
  },
  bankInfo: {
    bankName: {
      type: String,
      required: false,
      default: 'กสิกรไทย'
    },
    accountName: {
      type: String,
      required: false,
      default: 'บริษัท วินริช ไดนามิก จำกัด'
    },
    accountNumber: {
      type: String,
      required: false,
      default: '123-4-56789-0'
    },
    branch: {
      type: String,
      required: false,
      default: 'อโศก'
    }
  }
}, {
  timestamps: true
});

export const Settings = mongoose.models.Settings || mongoose.model<ISettings>('Settings', settingsSchema);
