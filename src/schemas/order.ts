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

export const taxInvoiceSchema = z.object({
  requestTaxInvoice: z.boolean().default(false),
  companyName: z.string().optional(),
  taxId: z.string().optional(),
  companyAddress: z.string().optional(),
  companyPhone: z.string().optional(),
  companyEmail: z.string().email().optional().or(z.literal('')),
});

export const orderInputSchema = z.object({
  customerName: z.string().min(1),
  customerPhone: z.string().min(9),
  customerAddress: z.string().optional(),
  paymentMethod: z.enum(['cod', 'transfer']).default('cod').optional(),
  slipUrl: z.string().url().optional().or(z.literal('')),
  items: z.array(orderItemSchema).min(1),
  shippingFee: z.number().min(0).default(0).optional(),
  discount: z.number().min(0).default(0).optional(),
  totalAmount: z.number().min(0),
  taxInvoice: taxInvoiceSchema.optional(),
});

export type TaxInvoice = z.infer<typeof taxInvoiceSchema>;
export type OrderInput = z.infer<typeof orderInputSchema>; 