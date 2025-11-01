import { z } from 'zod';

export const createPipelineStageSchema = z.object({
  name: z.string().min(1).max(100),
  order: z.number().min(0),
  color: z.string().optional(),
  probability: z.number().min(0).max(100).optional(),
  isDefault: z.boolean().optional().default(false),
  isWon: z.boolean().optional().default(false),
  isLost: z.boolean().optional().default(false),
  team: z.string().optional(),
});

export const updatePipelineStageSchema = createPipelineStageSchema.partial();

export const searchPipelineStageSchema = z.object({
  team: z.string().optional(),
});

export type CreatePipelineStageInput = z.infer<typeof createPipelineStageSchema>;
export type UpdatePipelineStageInput = z.infer<typeof updatePipelineStageSchema>;
export type SearchPipelineStageInput = z.infer<typeof searchPipelineStageSchema>;


