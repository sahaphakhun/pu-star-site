import { z } from 'zod';

// Schema สำหรับการสร้างหมวดหมู่ใหม่
export const createCategorySchema = z.object({
  name: z.string()
    .min(1, 'กรุณาระบุชื่อหมวดหมู่')
    .max(100, 'ชื่อหมวดหมู่ต้องไม่เกิน 100 ตัวอักษร')
    .trim(),
  description: z.string()
    .max(500, 'คำอธิบายต้องไม่เกิน 500 ตัวอักษร')
    .optional()
    .default('')
});

// Schema สำหรับการอัปเดตหมวดหมู่
export const updateCategorySchema = z.object({
  name: z.string()
    .min(1, 'กรุณาระบุชื่อหมวดหมู่')
    .max(100, 'ชื่อหมวดหมู่ต้องไม่เกิน 100 ตัวอักษร')
    .trim()
    .optional(),
  description: z.string()
    .max(500, 'คำอธิบายต้องไม่เกิน 500 ตัวอักษร')
    .optional(),
  isActive: z.boolean().optional()
});

// Type definitions
export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;
