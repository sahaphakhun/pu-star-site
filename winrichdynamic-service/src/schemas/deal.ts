import { z } from 'zod';

export const createDealSchema = z.object({
  title: z.string().min(2).max(200),
  customerId: z.string().min(1),
  customerName: z.string().min(1).max(200).optional(),
  amount: z.number().nonnegative(),
  currency: z.string().min(1).max(10).optional().default('THB'),
  stageId: z.string().min(1),
  stageName: z.string().max(100).optional(),
  ownerId: z.string().optional(),
  team: z.string().optional(),
  expectedCloseDate: z.coerce.date().optional(),
  status: z.enum(['open', 'won', 'lost']).optional().default('open'),
  probability: z.number().min(0).max(100).optional(),
  tags: z.array(z.string()).optional().default([]),
  description: z.string().max(2000).optional(),
  quotationIds: z.array(z.string()).optional().default([]),
});

export const updateDealSchema = createDealSchema.partial();

export const searchDealSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  q: z.string().optional(),
  stageId: z.string().optional(),
  ownerId: z.string().optional(),
  team: z.string().optional(),
  status: z.enum(['open', 'won', 'lost']).optional(),
});

export type CreateDealInput = z.infer<typeof createDealSchema>;
export type UpdateDealInput = z.infer<typeof updateDealSchema>;
export type SearchDealInput = z.infer<typeof searchDealSchema>;


