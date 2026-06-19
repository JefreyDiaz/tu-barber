import { z } from 'zod';

const slugSchema = z
  .string()
  .min(3, 'Mínimo 3 caracteres')
  .max(30, 'Máximo 30 caracteres')
  .regex(/^[a-z0-9-]+$/, 'Solo minúsculas, números y guiones')
  .refine(
    (s) => !['app', 'www', 'api', 'admin', 'platform', 'registro'].includes(s),
    'Este slug está reservado'
  );

export const onboardingSchema = z.object({
  shopName: z.string().min(2).max(80).trim(),
  slug: slugSchema,
  ownerName: z.string().min(2).max(50).trim(),
  ownerEmail: z.string().email(),
  ownerPhone: z
    .string()
    .regex(/^\d{10}$/, 'Teléfono debe ser 10 dígitos')
    .transform((s) => '+57' + s),
  username: z.string().min(3).max(30).trim(),
  password: z.string().min(8, 'Mínimo 8 caracteres'),
  plan: z.enum(['basic', 'pro']).default('pro'),
});

export type OnboardingData = z.infer<typeof onboardingSchema>;

export const tenantSettingsSchema = z.object({
  logoUrl: z.string().url().optional().or(z.literal('')),
  primaryColor: z.string().optional(),
  slotDurationMinutes: z.number().int().min(15).max(120).optional(),
  minAdvanceHours: z.number().int().min(0).max(48).optional(),
  maxAdvanceDays: z.number().int().min(1).max(90).optional(),
  cancelNoticeHours: z.number().int().min(0).max(48).optional(),
  scheduleJson: z.record(z.string(), z.array(z.object({ start: z.number(), end: z.number() })).nullable()).optional(),
  manychatApiKey: z.string().optional(),
  manychatFlowBooking: z.string().optional(),
  manychatFlowBarber: z.string().optional(),
  manychatFlowReminder: z.string().optional(),
});

export const customDomainSchema = z.object({
  customDomain: z
    .string()
    .min(4)
    .max(253)
    .regex(/^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$/i, 'Dominio inválido'),
});
