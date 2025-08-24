import { z } from 'zod';

// Schema สำหรับ QuotationItem
export const quotationItemSchema = z.object({
  productId: z.string()
    .min(1, 'กรุณาระบุรหัสสินค้า')
    .trim(),
  productName: z.string()
    .min(1, 'กรุณาระบุชื่อสินค้า')
    .max(200, 'ชื่อสินค้าต้องมีความยาวไม่เกิน 200 ตัวอักษร')
    .trim(),
  description: z.string()
    .max(500, 'รายละเอียดสินค้าต้องมีความยาวไม่เกิน 500 ตัวอักษร')
    .optional()
    .or(z.literal('')),
  quantity: z.number()
    .min(0.01, 'จำนวนต้องมากกว่า 0'),
  unit: z.string()
    .min(1, 'กรุณาระบุหน่วย')
    .max(20, 'หน่วยต้องมีความยาวไม่เกิน 20 ตัวอักษร')
    .trim(),
  unitPrice: z.number()
    .min(0, 'ราคาต่อหน่วยต้องไม่ต่ำกว่า 0'),
  discount: z.number()
    .min(0, 'ส่วนลดต้องไม่ต่ำกว่า 0')
    .max(100, 'ส่วนลดต้องไม่เกิน 100%')
    .default(0),
  totalPrice: z.number()
    .min(0, 'ราคารวมต้องไม่ต่ำกว่า 0'),
});

// Schema สำหรับการสร้างใบเสนอราคาใหม่
export const createQuotationSchema = z.object({
  customerId: z.string()
    .min(1, 'กรุณาเลือกลูกค้า')
    .trim(),
  customerName: z.string()
    .min(1, 'กรุณาระบุชื่อลูกค้า')
    .max(200, 'ชื่อลูกค้าต้องมีความยาวไม่เกิน 200 ตัวอักษร')
    .trim(),
  customerTaxId: z.string()
    .regex(/^\d{13}$/, 'เลขประจำตัวผู้เสียภาษีต้องเป็นตัวเลข 13 หลัก')
    .optional()
    .or(z.literal(''))
    .refine((val) => !val || /^\d{13}$/.test(val), {
      message: 'เลขประจำตัวผู้เสียภาษีต้องเป็นตัวเลข 13 หลัก'
    }),
  customerAddress: z.string()
    .max(500, 'ที่อยู่ลูกค้าต้องมีความยาวไม่เกิน 500 ตัวอักษร')
    .optional()
    .or(z.literal('')),
  customerPhone: z.string()
    .optional()
    .or(z.literal(''))
    .refine((val) => !val || /^(\+?66|0)\d{9}$/.test(val), {
      message: 'รูปแบบเบอร์โทรศัพท์ลูกค้าไม่ถูกต้อง (ตัวอย่าง: 0812345678, +66812345678)'
    }),
  subject: z.string()
    .min(1, 'กรุณาระบุหัวข้อใบเสนอราคา')
    .max(200, 'หัวข้อใบเสนอราคาต้องมีความยาวไม่เกิน 200 ตัวอักษร')
    .trim(),
  validUntil: z.string()
    .min(1, 'กรุณาระบุวันหมดอายุ')
    .refine((str) => {
      const date = new Date(str);
      return !isNaN(date.getTime()) && date > new Date();
    }, 'วันหมดอายุต้องเป็นวันที่ในอนาคต'),
  paymentTerms: z.string()
    .min(1, 'กรุณาระบุเงื่อนไขการชำระเงิน')
    .max(200, 'เงื่อนไขการชำระเงินต้องมีความยาวไม่เกิน 200 ตัวอักษร')
    .trim()
    .default('ชำระเงินทันที'),
  deliveryTerms: z.string()
    .max(200, 'เงื่อนไขการส่งมอบต้องมีความยาวไม่เกิน 200 ตัวอักษร')
    .optional()
    .or(z.literal('')),
  items: z.array(quotationItemSchema)
    .min(1, 'ต้องมีรายการสินค้าอย่างน้อย 1 รายการ'),
  vatRate: z.number()
    .min(0, 'อัตราภาษีมูลค่าเพิ่มต้องไม่ต่ำกว่า 0')
    .max(100, 'อัตราภาษีมูลค่าเพิ่มต้องไม่เกิน 100')
    .default(7),
  assignedTo: z.string()
    .max(100, 'ชื่อผู้รับผิดชอบต้องมีความยาวไม่เกิน 100 ตัวอักษร')
    .optional()
    .or(z.literal('')),
  notes: z.string()
    .max(1000, 'หมายเหตุต้องมีความยาวไม่เกิน 1000 ตัวอักษร')
    .optional()
    .or(z.literal('')),
  // Add calculated fields that the model expects
  subtotal: z.number().optional(),
  totalDiscount: z.number().optional(),
  totalAmount: z.number().optional(),
  vatAmount: z.number().optional(),
  grandTotal: z.number().optional(),
  status: z.enum(['draft', 'sent', 'accepted', 'rejected', 'expired']).optional().default('draft'),
});

// Schema สำหรับการอัพเดทใบเสนอราคา
export const updateQuotationSchema = createQuotationSchema.partial().extend({
  status: z.enum(['draft', 'sent', 'accepted', 'rejected', 'expired']).optional(),
  sentAt: z.string().optional().transform((str) => str ? new Date(str) : undefined),
  sentBy: z.string().max(100, 'ชื่อผู้ส่งต้องมีความยาวไม่เกิน 100 ตัวอักษร').optional().or(z.literal('')),
  sentMethod: z.enum(['email', 'line', 'manual']).optional(),
  respondedAt: z.string().optional().transform((str) => str ? new Date(str) : undefined),
  responseNotes: z.string().max(1000, 'หมายเหตุการตอบกลับต้องมีความยาวไม่เกิน 1000 ตัวอักษร').optional().or(z.literal('')),
  convertedToOrder: z.string().optional().or(z.literal('')),
});

// Schema สำหรับการค้นหาใบเสนอราคา
export const searchQuotationSchema = z.object({
  q: z.string().optional(),
  customerId: z.string().optional(),
  status: z.enum(['draft', 'sent', 'accepted', 'rejected', 'expired']).optional(),
  assignedTo: z.string().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(20),
});

// Schema สำหรับการเปลี่ยนสถานะใบเสนอราคา
export const updateQuotationStatusSchema = z.object({
  status: z.enum(['draft', 'sent', 'accepted', 'rejected', 'expired']),
  notes: z.string().optional(),
});

// Schema สำหรับการส่งใบเสนอราคา
export const sendQuotationSchema = z.object({
  method: z.enum(['email', 'line', 'manual']),
  sentBy: z.string().min(1, 'กรุณาระบุชื่อผู้ส่ง'),
  notes: z.string().optional(),
});

// Schema สำหรับการแปลงเป็น Sales Order
export const convertToOrderSchema = z.object({
  orderNumber: z.string().min(1, 'กรุณาระบุเลขที่ใบสั่งขาย'),
  notes: z.string().optional(),
});

// Type definitions
export type CreateQuotationInput = z.infer<typeof createQuotationSchema>;
export type UpdateQuotationInput = z.infer<typeof updateQuotationSchema>;
export type SearchQuotationInput = z.infer<typeof searchQuotationSchema>;
export type UpdateQuotationStatusInput = z.infer<typeof updateQuotationStatusSchema>;
export type SendQuotationInput = z.infer<typeof sendQuotationSchema>;
export type ConvertToOrderInput = z.infer<typeof convertToOrderSchema>;
export type QuotationItemInput = z.infer<typeof quotationItemSchema>;
