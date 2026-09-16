import { z } from 'zod';

const urlSchema = z.string().url('URL inválida').max(2048);

const tutorialFields = {
  title: z.string().min(2, 'Mínimo 2 caracteres').max(120).trim(),
  description: z.string().min(5, 'Mínimo 5 caracteres').max(500).trim(),
  imageUrl: urlSchema,
  linkUrl: urlSchema.refine((url) => url.startsWith('https://'), {
    message: 'El enlace debe usar HTTPS',
  }),
  isActive: z.boolean().optional(),
} as const;

export const platformTutorialCreateSchema = z.object(tutorialFields);

export const platformTutorialUpdateSchema = platformTutorialCreateSchema.partial();

export const platformTutorialReorderSchema = z.object({
  orderedIds: z.array(z.string().uuid()).min(1, 'Se requiere al menos un tutorial'),
});

export type PlatformTutorialCreateInput = z.infer<typeof platformTutorialCreateSchema>;
