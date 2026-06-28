import { z } from 'zod';
import { usernameSchema } from '@/lib/validations/username';

export const createUserSchema = z.object({
  name: z
    .string()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(50, 'El nombre no puede exceder 50 caracteres')
    .trim(),
  username: usernameSchema,
  password: z
    .string()
    .min(8, 'La contraseña debe tener al menos 8 caracteres')
    .max(100),
  photo: z.union([z.string().url('URL inválida').max(1000), z.literal('')]).optional(),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  phone: z
    .string()
    .min(1, 'El teléfono es obligatorio')
    .regex(/^\d{10}$/, 'Teléfono debe ser 10 dígitos (sin espacios ni guiones)')
    .transform((s) => '+57' + s),
  role: z.enum(['admin', 'dueno', 'barbero']).default('barbero'),
  isActive: z.boolean().default(true),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;

// Schema para actualizar usuario (admin - todos los campos)
export const updateUserSchema = z.object({
  name: z
    .string()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(50, 'El nombre no puede exceder 50 caracteres')
    .trim(),
  username: usernameSchema,
  password: z
    .string()
    .min(8, 'La contraseña debe tener al menos 8 caracteres')
    .max(100)
    .optional()
    .or(z.literal('')),
  photo: z.union([z.string().url('URL inválida').max(1000), z.literal('')]).optional(),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  phone: z
    .string()
    .min(1, 'El teléfono es obligatorio')
    .regex(/^\d{10}$/, 'Teléfono debe ser 10 dígitos (sin espacios ni guiones)')
    .transform((s) => '+57' + s),
  role: z.enum(['admin', 'dueno', 'barbero']).default('barbero'),
  isActive: z.boolean().default(true),
});

export type UpdateUserInput = z.infer<typeof updateUserSchema>;

// Schema para edición limitada del dueño (nombre, teléfono y estado)
export const updateUserByOwnerSchema = z.object({
  name: z
    .string()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(50, 'El nombre no puede exceder 50 caracteres')
    .trim(),
  phone: z
    .string()
    .min(1, 'El teléfono es obligatorio')
    .regex(/^\d{10}$/, 'Teléfono debe ser 10 dígitos (sin espacios ni guiones)')
    .transform((s) => '+57' + s),
  password: z
    .string()
    .min(8, 'La contraseña debe tener al menos 8 caracteres')
    .optional()
    .or(z.literal('')),
  photo: z.union([z.string().url('URL inválida').max(1000), z.literal('')]).optional(),
  isActive: z.boolean().optional(),
});

export type UpdateUserByOwnerInput = z.infer<typeof updateUserByOwnerSchema>;
