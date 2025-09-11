import { z } from 'zod';

export const createLeadSchema = z.object({
  name: z.string().min(1),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  company: z.string().optional(),
  source: z.enum(['facebook', 'line', 'website', 'referral', 'other']).default('other'),
  ownerId: z.string().optional(),
});

export const searchLeadSchema = z.object({
  q: z.string().optional(),
  status: z.enum(['new', 'qualified', 'disqualified', 'converted']).optional(),
  source: z.enum(['facebook', 'line', 'website', 'referral', 'other']).optional(),
  ownerId: z.string().optional(),
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(20),
});

export const convertLeadSchema = z.object({
  // MVP: อนุญาตว่างเพื่อใช้ค่าจาก Lead โดยตรง
  title: z.string().min(1).optional(),
  amount: z.number().nonnegative().default(0),
  stageId: z.string().optional(),
});

import { z } from 'zod';

const emptyToUndefined = z
  .string()
  .transform((val) => (val?.trim() === '' ? undefined : val))
  .optional();

export const createLeadSchema = z.object({
  name: z.string().min(1).max(200),
  phone: emptyToUndefined,
  email: emptyToUndefined.pipe(z.string().email().optional()),
  company: emptyToUndefined.pipe(z.string().max(200).optional()),
  source: z.enum(['facebook', 'line', 'website', 'referral', 'other']).optional().default('other'),
  score: z.coerce.number().min(0).max(100).optional(),
  status: z.enum(['new', 'qualified', 'disqualified', 'converted']).optional(),
  notes: emptyToUndefined.pipe(z.string().max(2000).optional()),
  ownerId: emptyToUndefined,
  team: emptyToUndefined,
});

export const updateLeadSchema = createLeadSchema.partial();

export const searchLeadSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  q: z.string().optional(),
  status: z.enum(['new', 'qualified', 'disqualified', 'converted']).optional(),
  source: z.enum(['facebook', 'line', 'website', 'referral', 'other']).optional(),
  ownerId: z.string().optional(),
  team: z.string().optional(),
});

export type CreateLeadInput = z.infer<typeof createLeadSchema>;
export type UpdateLeadInput = z.infer<typeof updateLeadSchema>;
export type SearchLeadInput = z.infer<typeof searchLeadSchema>;


