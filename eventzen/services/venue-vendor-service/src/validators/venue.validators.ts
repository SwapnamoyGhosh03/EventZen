import { z } from 'zod';

export const createVenueSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200),
  description: z.string().optional(),
  address: z.object({
    street: z.string().optional(),
    city: z.string().min(1, 'City is required'),
    state: z.string().optional(),
    country: z.string().optional(),
    zip: z.string().optional(),
  }),
  location: z
    .object({
      type: z.literal('Point').default('Point'),
      coordinates: z.tuple([z.number(), z.number()]),
    })
    .optional(),
  total_capacity: z.number().int().positive('Total capacity must be positive'),
  halls: z
    .array(
      z.object({
        hall_id: z.string().min(1),
        name: z.string().min(1),
        capacity: z.number().int().positive(),
        amenities: z.array(z.string()).optional().default([]),
        hourly_rate: z.number().positive(),
        floor: z.number().int().optional(),
      })
    )
    .optional()
    .default([]),
  amenities: z.array(z.string()).optional().default([]),
  media_gallery: z
    .array(
      z.object({
        url: z.string().min(1),
        caption: z.string().optional(),
        type: z.string().optional(),
      })
    )
    .optional()
    .default([]),
  pricing: z
    .object({
      base_rate: z.number().positive().optional(),
      currency: z.string().default('USD'),
      pricing_model: z.string().optional(),
    })
    .optional(),
  contact: z
    .object({
      name: z.string().optional(),
      email: z.string().email().optional(),
      phone: z.string().optional(),
    })
    .optional(),
});

export const updateVenueSchema = createVenueSchema.partial();

export const bookVenueSchema = z.object({
  hall_id: z.string().optional(),
  event_id: z.string().min(1, 'Event ID is required'),
  booking_start: z.string().datetime({ message: 'Invalid booking_start datetime' }),
  booking_end: z.string().datetime({ message: 'Invalid booking_end datetime' }),
  notes: z.string().optional(),
});

export const availabilityQuerySchema = z.object({
  hall_id: z.string().optional(),
  start: z.string().datetime({ message: 'Invalid start datetime' }),
  end: z.string().datetime({ message: 'Invalid end datetime' }),
});
