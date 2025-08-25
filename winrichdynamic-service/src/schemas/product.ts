import { z } from 'zod';

// Schema สำหรับ option value
const optionValueSchema = z.object({
  label: z.string().min(1, 'ค่าตัวเลือกไม่สามารถว่างได้'),
  imageUrl: z.string().optional(),
  isAvailable: z.boolean().default(true)
});

// Schema สำหรับ product option
const productOptionSchema = z.object({
  name: z.string().min(1, 'ชื่อตัวเลือกไม่สามารถว่างได้'),
  values: z.array(optionValueSchema).min(1, 'ต้องมีค่าตัวเลือกอย่างน้อย 1 ค่า')
});

// Schema สำหรับ unit
const unitSchema = z.object({
  label: z.string().min(1, 'ชื่อหน่วยไม่สามารถว่างได้'),
  price: z.number().min(0, 'ราคาต้องไม่ต่ำกว่า 0'),
  shippingFee: z.number().min(0, 'ค่าส่งต้องไม่ต่ำกว่า 0').optional()
});

// Schema สำหรับ SKU variant
const skuVariantSchema = z.object({
  key: z.string(),
  unitLabel: z.string().optional(),
  options: z.record(z.string(), z.string()),
  sku: z.string().min(1, 'SKU ไม่สามารถว่างได้'),
  isActive: z.boolean()
});

// Schema สำหรับ SKU config
const skuConfigSchema = z.object({
  prefix: z.string().min(1, 'ตัวอักษรนำหน้า SKU ไม่สามารถว่างได้'),
  separator: z.string().default('-'),
  autoGenerate: z.boolean(),
  customSku: z.string().optional()
});

// Schema หลักสำหรับ product
export const productSchema = z.object({
  name: z.string().min(1, 'ชื่อสินค้าไม่สามารถว่างได้'),
  description: z.string().min(1, 'รายละเอียดสินค้าไม่สามารถว่างได้'),
  sku: z.string().optional(), // เพิ่ม field sku เป็น optional โดยไม่มี validation ที่ขัดแย้ง
  price: z.number().min(0, 'ราคาต้องไม่ต่ำกว่า 0').optional(),
  shippingFee: z.number().min(0, 'ค่าส่งต้องไม่ต่ำกว่า 0').optional(),
  units: z.array(unitSchema).optional(),
  category: z.string().min(1, 'หมวดหมู่ไม่สามารถว่างได้'),
  imageUrl: z.string().min(1, 'รูปภาพสินค้าไม่สามารถว่างได้'),
  isAvailable: z.boolean().default(true),
  options: z.array(productOptionSchema).optional(),
  skuConfig: skuConfigSchema.optional(),
  skuVariants: z.array(skuVariantSchema).optional()
});

// Schema สำหรับการสร้าง product
export const createProductSchema = productSchema;

// Schema สำหรับการอัพเดท product
export const updateProductSchema = productSchema.partial();

// Schema สำหรับการค้นหา product
export const productSearchSchema = z.object({
  search: z.string().optional(),
  category: z.string().optional(),
  isAvailable: z.boolean().optional(),
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(20)
});

// Type exports
export type Product = z.infer<typeof productSchema>;
export type CreateProduct = z.infer<typeof createProductSchema>;
export type UpdateProduct = z.infer<typeof updateProductSchema>;
export type ProductSearch = z.infer<typeof productSearchSchema>;
export type ProductOption = z.infer<typeof productOptionSchema>;
export type ProductUnit = z.infer<typeof unitSchema>;
export type SkuVariant = z.infer<typeof skuVariantSchema>;
export type SkuConfig = z.infer<typeof skuConfigSchema>;
