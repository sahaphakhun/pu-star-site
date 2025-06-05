import { z } from 'zod';

export const adminPhoneSchema = z.object({
  phoneNumber: z.string().min(10),
});

export type AdminPhoneInput = z.infer<typeof adminPhoneSchema>; 