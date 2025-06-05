import { z } from 'zod';

export const orderItemSchema = z.object({
  productId: z.string().min(1),
  name: z.string().min(1),
  price: z.number().min(0),
  quantity: z.number().int().positive(),
  selectedOptions: z.record(z.string(), z.string()).optional(),
  unitLabel: z.string().optional(),
  unitPrice: z.number().min(0).optional(),
});

export const orderInputSchema = z.object({
  customerName: z.string().min(1),
  customerPhone: z.string().min(9),
  customerAddress: z.string().optional(),
  paymentMethod: z.enum(['cod', 'transfer']).default('cod').optional(),
  slipUrl: z.string().url().optional(),
  items: z.array(orderItemSchema).min(1),
  shippingFee: z.number().min(0).default(0).optional(),
  discount: z.number().min(0).default(0).optional(),
  totalAmount: z.number().min(0),
});

export type OrderInput = z.infer<typeof orderInputSchema>; 