import { z } from 'zod';

export const createApprovalSchema = z.object({
  targetType: z.enum(['deal']),
  targetId: z.string().min(1),
  reason: z.string().max(1000).optional(),
});

export const updateApprovalSchema = z.object({
  status: z.enum(['approved', 'rejected']),
  decisionReason: z.string().max(1000).optional(),
});

export const searchApprovalSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  status: z.enum(['pending', 'approved', 'rejected']).optional(),
  targetType: z.enum(['deal']).optional(),
  targetId: z.string().optional(),
});


