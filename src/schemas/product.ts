import { z } from 'zod';

export const unitSchema = z.object({
  label: z.string().min(1, 'label required'),
  price: z.number().min(0, 'price >= 0'),
  multiplier: z.number().min(1).optional(),
  shippingFee: z.number().min(0).optional(),
});

export const optionValueSchema = z.object({
  label: z.string().min(1),
  imageUrl: z.string().min(1).optional(),
  isAvailable: z.boolean().optional(),
});

export const optionSchema = z.object({
  name: z.string().min(1),
  values: z.array(optionValueSchema).min(1),
});

export const productInputSchema = z.object({
  name: z.string().min(1),
  price: z.number().min(0).optional(),
  description: z.string().min(1),
  imageUrl: z.string().min(1),
  shippingFee: z.number().min(0).optional(),
  units: z.array(unitSchema).optional(),
  category: z.string().optional(),
  options: z.array(optionSchema).optional(),
  isAvailable: z.boolean().optional(),
  isWmsEnabled: z.boolean().optional(),
  wmsConfig: z
    .object({
      productCode: z.string().min(1),
      lotGen: z.string().min(1),
      locationBin: z.string().min(1),
      lotMfg: z.string().optional(),
      adminUsername: z.string().min(1),
      isEnabled: z.boolean().optional(),
    })
    .optional(),
  wmsVariantConfigs: z
    .array(
      z.object({
        key: z.string().min(1),
        unitLabel: z.string().optional(),
        options: z.record(z.string(), z.string()).optional(),
        productCode: z.string().min(1),
        lotGen: z.string().min(1),
        locationBin: z.string().min(1),
        lotMfg: z.string().optional(),
        adminUsername: z.string().min(1),
        isEnabled: z.boolean().optional(),
      })
    )
    .optional(),
});

export type ProductInput = z.infer<typeof productInputSchema>; 