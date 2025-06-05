import { z } from 'zod';

export const unitSchema = z.object({
  label: z.string().min(1, 'label required'),
  price: z.number().min(0, 'price >= 0'),
  multiplier: z.number().min(1).optional(),
});

export const optionValueSchema = z.object({
  label: z.string().min(1),
  imageUrl: z.string().url().optional(),
});

export const optionSchema = z.object({
  name: z.string().min(1),
  values: z.array(optionValueSchema).min(1),
});

export const productInputSchema = z.object({
  name: z.string().min(1),
  price: z.number().min(0).optional(),
  description: z.string().min(1),
  imageUrl: z.string().url(),
  units: z.array(unitSchema).optional(),
  category: z.string().optional(),
  options: z.array(optionSchema).optional(),
});

export type ProductInput = z.infer<typeof productInputSchema>; 