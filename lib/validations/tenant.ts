import { z } from 'zod';
import { PLAN_IDS } from '@/lib/plans';

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
  shopName: z.string().trim().min(2, 'Mínimo 2 caracteres').max(80, 'Máximo 80 caracteres'),
  slug: slugSchema,
  ownerName: z.string().trim().min(2, 'Mínimo 2 caracteres').max(50, 'Máximo 50 caracteres'),
  ownerEmail: z.string().trim().email('Email inválido'),
  ownerPhone: z
    .string()
    .regex(/^\d{10}$/, 'Debe tener exactamente 10 dígitos')
    .transform((s) => '+57' + s),
  username: z.string().trim().min(3, 'Mínimo 3 caracteres').max(30, 'Máximo 30 caracteres'),
  password: z.string().min(8, 'Mínimo 8 caracteres'),
  plan: z.enum(PLAN_IDS, { error: 'Plan inválido' }).default('negocio'),
});

export function formatOnboardingValidationError(
  issues: z.core.$ZodIssue[]
): string {
  return issues
    .map((issue) => {
      const field = issue.path[0];
      const labels: Record<string, string> = {
        shopName: 'Nombre de la barbería',
        slug: 'Subdominio',
        ownerName: 'Nombre',
        ownerEmail: 'Email',
        ownerPhone: 'Teléfono WhatsApp',
        username: 'Usuario',
        password: 'Contraseña',
        plan: 'Plan',
      };
      const label = field ? labels[String(field)] ?? String(field) : 'Formulario';
      return `${label}: ${issue.message}`;
    })
    .join(' · ');
}

export type OnboardingData = z.infer<typeof onboardingSchema>;

export const tenantSettingsSchema = z.object({
  logoUrl: z.string().url().optional().or(z.literal('')),
  primaryColor: z.string().optional(),
  slotDurationMinutes: z.number().int().min(15).max(120).optional(),
  minAdvanceHours: z.number().int().min(0).max(48).optional(),
  maxAdvanceDays: z.number().int().min(1).max(90).optional(),
  cancelNoticeHours: z.number().int().min(0).max(48).optional(),
  scheduleJson: z.record(z.string(), z.array(z.object({ start: z.number(), end: z.number() })).nullable()).optional(),
  twilioAccountSid: z.string().optional(),
  twilioAuthToken: z.string().optional(),
  twilioWhatsappFrom: z.string().optional(),
  twilioContentSidBooking: z.string().optional(),
  twilioContentSidBarber: z.string().optional(),
  twilioContentSidReminder: z.string().optional(),
});

export const customDomainSchema = z.object({
  customDomain: z
    .string()
    .min(4)
    .max(253)
    .regex(/^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$/i, 'Dominio inválido'),
});
