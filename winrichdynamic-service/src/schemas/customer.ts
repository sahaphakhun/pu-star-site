import { z } from 'zod';

// Schema สำหรับการสร้างลูกค้าใหม่
export const createCustomerSchema = z.object({
  name: z.string()
    .min(2, 'ชื่อลูกค้าต้องมีความยาวอย่างน้อย 2 ตัวอักษร')
    .max(100, 'ชื่อลูกค้าต้องมีความยาวไม่เกิน 100 ตัวอักษร')
    .trim(),
  phoneNumber: z.string()
    .regex(/^\+?66\d{9}$/, 'รูปแบบเบอร์โทรศัพท์ไม่ถูกต้อง กรุณาใช้รูปแบบ +66xxxxxxxxx หรือ 0xxxxxxxxx')
    .trim(),
  email: z.string()
    .email('รูปแบบอีเมลไม่ถูกต้อง')
    .optional()
    .or(z.literal('')),
  taxId: z.string()
    .regex(/^\d{13}$/, 'เลขประจำตัวผู้เสียภาษีต้องเป็นตัวเลข 13 หลัก')
    .optional()
    .or(z.literal('')),
  companyName: z.string()
    .max(200, 'ชื่อบริษัทต้องมีความยาวไม่เกิน 200 ตัวอักษร')
    .optional()
    .or(z.literal('')),
  companyAddress: z.string()
    .max(500, 'ที่อยู่บริษัทต้องมีความยาวไม่เกิน 500 ตัวอักษร')
    .optional()
    .or(z.literal('')),
  companyPhone: z.string()
    .regex(/^\+?66\d{9}$/, 'รูปแบบเบอร์โทรศัพท์บริษัทไม่ถูกต้อง')
    .optional()
    .or(z.literal('')),
  companyEmail: z.string()
    .email('รูปแบบอีเมลบริษัทไม่ถูกต้อง')
    .optional()
    .or(z.literal('')),
  shippingAddress: z.string()
    .max(500, 'ที่อยู่จัดส่งต้องมีความยาวไม่เกิน 500 ตัวอักษร')
    .optional()
    .or(z.literal('')),
  shippingSameAsCompany: z.boolean().optional().default(false),
  customerType: z.enum(['new', 'regular', 'target', 'inactive'])
    .default('new'),
  assignedTo: z.string()
    .max(100, 'ชื่อผู้รับผิดชอบต้องมีความยาวไม่เกิน 100 ตัวอักษร')
    .optional()
    .or(z.literal('')),
  creditLimit: z.number()
    .min(0, 'วงเงินเครดิตต้องไม่ต่ำกว่า 0')
    .optional(),
  paymentTerms: z.string()
    .max(200, 'เงื่อนไขการชำระเงินต้องมีความยาวไม่เกิน 200 ตัวอักษร')
    .default('ชำระเงินทันที'),
  notes: z.string()
    .max(1000, 'หมายเหตุต้องมีความยาวไม่เกิน 1000 ตัวอักษร')
    .optional()
    .or(z.literal('')),
  isActive: z.boolean().default(true),
  // ฟิลด์เพิ่มเติมสำหรับการใช้งาน B2B
  tags: z.array(z.string()).optional().default([]),
  priorityStar: z.number().min(0).max(5).optional().default(0),
  goals: z.string().max(2000).optional().or(z.literal('')),
  authorizedPhones: z.array(
    z.string().regex(/^(\+?66)\d{9}$/, 'รูปแบบเบอร์โทรต้องเป็น 66xxxxxxxxx')
  ).optional().default([]),
  
  // สถานะการขาย
  status: z.enum(['planning', 'proposed', 'quoted', 'testing', 'approved', 'closed'])
    .default('planning'),
  
  // ข้อมูลสำหรับสถานะ "นำเสนอสินค้า"
  companyPhoto: z.string().optional(),
  storeDetails: z.string().max(1000).optional(),
  salesOpportunities: z.array(z.object({
    productId: z.string().optional(),
    productName: z.string().optional(),
    competitorPrice: z.number().optional(),
    competitorBrand: z.string().optional(),
  })).optional().default([]),
  futureProducts: z.array(z.object({
    productName: z.string().optional(),
    details: z.string().optional(),
  })).optional().default([]),
  
  // ข้อมูลสำหรับสถานะ "เสนอราคา"
  quotationHistory: z.array(z.object({
    quotationId: z.string().optional(),
    date: z.date().optional(),
    amount: z.number().optional(),
    status: z.string().optional(),
  })).optional().default([]),
  newQuotationReason: z.string().max(500).optional(),
  
  // ข้อมูลสำหรับสถานะ "ทดสอบตัวอย่างสินค้า"
  sampleRequestHistory: z.array(z.object({
    requestId: z.string().optional(),
    date: z.date().optional(),
    items: z.array(z.object({
      productId: z.string().optional(),
      productName: z.string().optional(),
      quantity: z.number().optional(),
    })).optional().default([]),
    status: z.string().optional(),
    testImages: z.array(z.string()).optional().default([]),
  })).optional().default([]),
  sampleReceipt: z.object({
    companyCopy: z.string().optional(),
    customerCopy: z.string().optional(),
  }).optional(),
  
  // ข้อมูลสำหรับสถานะ "อนุมัติราคา"
  creditApproval: z.object({
    requestedAmount: z.number().optional(),
    paymentPeriod: z.string().optional(),
    reason: z.string().optional(),
    responsiblePerson: z.string().optional(),
    documents: z.array(z.object({
      type: z.string().optional(),
      url: z.string().optional(),
      name: z.string().optional(),
    })).optional().default([]),
    creditLimit: z.number().optional(),
    creditStartDate: z.date().optional(),
    status: z.enum(['pending', 'approved', 'rejected']).default('pending'),
  }).optional(),
});

// Schema สำหรับการอัพเดทลูกค้า
export const updateCustomerSchema = createCustomerSchema.partial();

// Schema สำหรับการค้นหาลูกค้า
export const searchCustomerSchema = z.object({
  q: z.string().optional(),
  customerType: z.enum(['new', 'regular', 'target', 'inactive']).optional(),
  assignedTo: z.string().optional(),
  isActive: z.boolean().optional(),
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(20),
});

// Schema สำหรับการ Import ลูกค้า
export const importCustomerSchema = z.object({
  customers: z.array(createCustomerSchema),
});

// Type definitions
export type CreateCustomerInput = z.infer<typeof createCustomerSchema>;
export type UpdateCustomerInput = z.infer<typeof updateCustomerSchema>;
export type SearchCustomerInput = z.infer<typeof searchCustomerSchema>;
export type ImportCustomerInput = z.infer<typeof importCustomerSchema>;
