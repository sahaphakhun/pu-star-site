import { z } from 'zod';

export const createLeadSchema = z.object({
  name: z.string().min(1).max(200),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  company: z.string().max(200).optional(),
  source: z.enum(['facebook', 'line', 'website', 'referral', 'other']).optional().default('other'),
  score: z.number().min(0).max(100).optional(),
  status: z.enum(['new', 'qualified', 'disqualified', 'converted']).optional(),
  notes: z.string().max(2000).optional(),
  ownerId: z.string().optional(),
  team: z.string().optional(),
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


