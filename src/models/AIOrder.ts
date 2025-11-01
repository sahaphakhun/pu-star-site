import mongoose, { Schema, Document } from 'mongoose';

export interface IAIOrderItem {
  sku: string | null;
  name: string;
  qty: number;
  variant: {
    color: string | null;
    size: string | null;
  };
  note: string | null;
}

export interface IAIOrderPricing {
  currency: string;
  subtotal: number;
  discount: number;
  shipping_fee: number;
  total: number;
}

export interface IAIOrderCustomer {
  name: string | null;
  phone: string | null;
  address: string | null;
}

export interface IAIOrder extends Document {
  psid: string; // Facebook PSID ของผู้ใช้
  order_status: 'draft' | 'collecting_info' | 'pending_confirmation' | 'completed' | 'canceled';
  items: IAIOrderItem[];
  pricing: IAIOrderPricing;
  customer: IAIOrderCustomer;
  errorMessages: string[];
  aiResponse: string; // ข้อความตอบกลับจาก AI
  userMessage: string; // ข้อความที่ผู้ใช้ส่งมา
  mappedOrderId?: Schema.Types.ObjectId; // ID ของ Order ที่แมพแล้ว (ถ้ามี)
  mappedAt?: Date; // เวลาที่แมพแล้ว
  mappedBy?: string; // ผู้ที่แมพ (แอดมิน)
  createdAt: Date;
  updatedAt: Date;
}

const aiOrderItemSchema = new Schema<IAIOrderItem>({
  sku: {
    type: String,
    default: null
  },
  name: {
    type: String,
    required: true
  },
  qty: {
    type: Number,
    required: true,
    min: 1
  },
  variant: {
    color: {
      type: String,
      default: null
    },
    size: {
      type: String,
      default: null
    }
  },
  note: {
    type: String,
    default: null
  }
});

const aiOrderPricingSchema = new Schema<IAIOrderPricing>({
  currency: {
    type: String,
    default: 'THB'
  },
  subtotal: {
    type: Number,
    required: true,
    min: 0
  },
  discount: {
    type: Number,
    default: 0,
    min: 0
  },
  shipping_fee: {
    type: Number,
    default: 0,
    min: 0
  },
  total: {
    type: Number,
    required: true,
    min: 0
  }
});

const aiOrderCustomerSchema = new Schema<IAIOrderCustomer>({
  name: {
    type: String,
    default: null
  },
  phone: {
    type: String,
    default: null
  },
  address: {
    type: String,
    default: null
  }
});

const aiOrderSchema = new Schema<IAIOrder>(
  {
    psid: {
      type: String,
      required: true,
      index: true
    },
    order_status: {
      type: String,
      enum: ['draft', 'collecting_info', 'pending_confirmation', 'completed', 'canceled'],
      default: 'draft'
    },
    items: [aiOrderItemSchema],
    pricing: aiOrderPricingSchema,
    customer: aiOrderCustomerSchema,
    errorMessages: [{
      type: String
    }],
    aiResponse: {
      type: String,
      required: true
    },
    userMessage: {
      type: String,
      required: true
    },
    mappedOrderId: {
      type: Schema.Types.ObjectId,
      ref: 'Order',
      default: null
    },
    mappedAt: {
      type: Date,
      default: null
    },
    mappedBy: {
      type: String,
      default: null
    }
  },
  { 
    timestamps: true 
  }
);

// เพิ่มดัชนีสำหรับการค้นหา
aiOrderSchema.index({ psid: 1, createdAt: -1 });
aiOrderSchema.index({ order_status: 1 });
aiOrderSchema.index({ mappedOrderId: 1 });

export default mongoose.models.AIOrder || mongoose.model<IAIOrder>('AIOrder', aiOrderSchema);
