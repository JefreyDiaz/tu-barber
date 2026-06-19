import { z } from 'zod';

export const serviceSchema = z.object({
  name: z.string().min(2, 'Mínimo 2 caracteres').max(60).trim(),
  durationMinutes: z.number().int().min(5, 'Mínimo 5 minutos').max(240, 'Máximo 240 minutos'),
  sortOrder: z.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
});

export type ServiceInput = z.infer<typeof serviceSchema>;
