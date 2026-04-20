import { z } from 'zod';

export const LocationUpdateSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  accuracy: z.number().min(0).max(100),
  venueId: z.string().uuid(),
});

export const QueueJoinSchema = z.object({
  vendorId: z.string().min(1).max(50),
  venueId: z.string().uuid(),
});

export const AssistantQuerySchema = z.object({
  query: z.string().min(1).max(500).trim(),
  venueId: z.string().uuid(),
  conversationId: z.string().optional(),
});
