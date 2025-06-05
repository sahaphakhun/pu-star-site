import { z } from 'zod';

export const shippingSettingSchema = z.object({
  freeThreshold: z.number().min(0).optional(),
  fee: z.number().min(0).optional(),
  freeQuantityThreshold: z.number().min(0).optional(),
});

export type ShippingSettingInput = z.infer<typeof shippingSettingSchema>; 