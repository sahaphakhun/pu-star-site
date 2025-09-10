import { z } from 'zod';

export const noteAttachmentSchema = z.object({
  url: z.string().url(),
  name: z.string().optional(),
  type: z.string().optional(),
});

export const createNoteSchema = z.object({
  content: z.string().min(1).max(5000),
  attachments: z.array(noteAttachmentSchema).optional().default([]),
  customerId: z.string().optional(),
  dealId: z.string().optional(),
  quotationId: z.string().optional(),
  ownerId: z.string().optional(),
});

export const updateNoteSchema = createNoteSchema.partial();

export const searchNoteSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  customerId: z.string().optional(),
  dealId: z.string().optional(),
  quotationId: z.string().optional(),
});

export type CreateNoteInput = z.infer<typeof createNoteSchema>;
export type UpdateNoteInput = z.infer<typeof updateNoteSchema>;
export type SearchNoteInput = z.infer<typeof searchNoteSchema>;


