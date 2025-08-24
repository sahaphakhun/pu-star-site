import { z } from 'zod';

export const unitSchema = z.object({
  label: z.string().min(1, 'กรุณาระบุชื่อหน่วย'),
  price: z.number().min(0, 'ราคาต้องไม่ต่ำกว่า 0'),
  multiplier: z.number().min(1).optional(),
  shippingFee: z.number().min(0).optional(),
});

export const optionValueSchema = z.object({
  label: z.string().min(1, 'กรุณาระบุค่าตัวเลือก'),
  imageUrl: z.string().min(1).optional(),
  isAvailable: z.boolean().optional(),
});

export const optionSchema = z.object({
  name: z.string().min(1, 'กรุณาระบุชื่อตัวเลือก'),
  values: z.array(optionValueSchema).min(1, 'กรุณาระบุค่าตัวเลือกอย่างน้อย 1 ค่า'),
});

export const skuConfigSchema = z.object({
  prefix: z.string().optional(),
  separator: z.string().optional(),
  autoGenerate: z.boolean().optional(),
  customSku: z.string().optional(),
});

export const skuVariantSchema = z.object({
  key: z.string().min(1),
  unitLabel: z.string().optional(),
  options: z.record(z.string(), z.string()).optional(),
  sku: z.string().min(1, 'กรุณาระบุ SKU'),
  isActive: z.boolean().optional(),
});

export const productInputSchema = z.object({
  name: z.string().min(1, 'กรุณาระบุชื่อสินค้า'),
  price: z.number().min(0, 'ราคาต้องไม่ต่ำกว่า 0'),
  description: z.string().min(1, 'กรุณาระบุรายละเอียดสินค้า'),
  imageUrl: z.string().min(1, 'กรุณาระบุรูปภาพสินค้า'),
  units: z.array(unitSchema).optional(),
  category: z.string().optional(),
  options: z.array(optionSchema).optional(),
  isAvailable: z.boolean().optional(),
  skuConfig: skuConfigSchema.optional(),
  skuVariants: z.array(skuVariantSchema).optional(),
});

export type ProductInput = z.infer<typeof productInputSchema>;
export type UnitInput = z.infer<typeof unitSchema>;
export type OptionInput = z.infer<typeof optionSchema>;
export type OptionValueInput = z.infer<typeof optionValueSchema>;
export type SkuConfigInput = z.infer<typeof skuConfigSchema>;
export type SkuVariantInput = z.infer<typeof skuVariantSchema>;
