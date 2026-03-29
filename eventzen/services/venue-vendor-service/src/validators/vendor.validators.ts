import { z } from 'zod';

const serviceTypes = [
  'CATERING',
  'AV',
  'DECOR',
  'SECURITY',
  'PHOTOGRAPHY',
  'ENTERTAINMENT',
  'LOGISTICS',
  'OTHER',
] as const;

export const createVendorSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200),
  description: z.string().optional(),
  service_type: z.enum(serviceTypes),
  service_packages: z
    .array(
      z.object({
        package_id: z.string().min(1),
        name: z.string().min(1),
        description: z.string().optional(),
        price: z.number().positive(),
        currency: z.string().default('USD'),
      })
    )
    .optional()
    .default([]),
  contact: z
    .object({
      name: z.string().optional(),
      email: z.string().email().optional(),
      phone: z.string().optional(),
    })
    .optional(),
  portfolio_urls: z.array(z.string().url()).optional().default([]),
});

export const submitReviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  comment: z.string().optional(),
});

export const createContractSchema = z.object({
  vendor_id: z.string().min(1, 'Vendor ID is required'),
  service_description: z.string().optional(),
  agreed_price: z.number().positive('Agreed price must be positive'),
  currency: z.string().default('USD'),
});

export const updateContractStatusSchema = z.object({
  status: z.enum(['PENDING', 'SIGNED', 'ACTIVE', 'COMPLETED', 'CANCELLED']),
  notes: z.string().optional(),
});
