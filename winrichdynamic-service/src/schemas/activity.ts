import { z } from 'zod';

export const createActivitySchema = z.object({
  type: z.enum(['call', 'meeting', 'email', 'task']),
  subject: z.string().min(1).max(200),
  notes: z.string().max(2000).optional(),
  customerId: z.string().optional(),
  dealId: z.string().optional(),
  quotationId: z.string().optional(),
  ownerId: z.string().optional(),
  scheduledAt: z.coerce.date().optional(),
  remindBeforeMinutes: z.number().min(0).max(60 * 24 * 30).optional(),
  status: z.enum(['planned', 'done', 'cancelled', 'postponed']).optional().default('planned'),
  postponeReason: z.string().max(500).optional(),
  cancelReason: z.string().max(500).optional(),
});

export const updateActivitySchema = createActivitySchema.partial();

export const searchActivitySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  customerId: z.string().optional(),
  dealId: z.string().optional(),
  quotationId: z.string().optional(),
  status: z.enum(['planned', 'done', 'cancelled', 'postponed']).optional(),
  type: z.enum(['call', 'meeting', 'email', 'task']).optional(),
});

export type CreateActivityInput = z.infer<typeof createActivitySchema>;
export type UpdateActivityInput = z.infer<typeof updateActivitySchema>;
export type SearchActivityInput = z.infer<typeof searchActivitySchema>;


