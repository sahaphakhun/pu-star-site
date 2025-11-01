import { z } from 'zod';

export const categoryInputSchema = z.object({
  name: z.string().min(1, 'กรุณาระบุชื่อหมวดหมู่').trim(),
  description: z.string().optional(),
  isActive: z.boolean().optional().default(true),
  displayOrder: z.number().min(0).optional().default(0),
});

export const categoryUpdateSchema = z.object({
  name: z.string().min(1, 'กรุณาระบุชื่อหมวดหมู่').trim().optional(),
  description: z.string().optional(),
  isActive: z.boolean().optional(),
  displayOrder: z.number().min(0).optional(),
});

export type CategoryInput = z.infer<typeof categoryInputSchema>;
export type CategoryUpdate = z.infer<typeof categoryUpdateSchema>;