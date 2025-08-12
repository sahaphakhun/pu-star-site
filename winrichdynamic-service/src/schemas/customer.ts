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
