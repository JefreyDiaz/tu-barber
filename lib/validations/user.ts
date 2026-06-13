import { z } from 'zod';

export const createUserSchema = z.object({
  name: z
    .string()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(50, 'El nombre no puede exceder 50 caracteres')
    .trim(),
  username: z
    .string()
    .min(3, 'El usuario debe tener al menos 3 caracteres')
    .max(30, 'El usuario no puede exceder 30 caracteres')
    .regex(/^[a-zA-Z0-9_]+$/, 'Solo letras, números y guión bajo'),
  password: z
    .string()
    .min(8, 'La contraseña debe tener al menos 8 caracteres')
    .max(100),
  photo: z.string().max(500).optional().or(z.literal('')),
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
  username: z
    .string()
    .min(3, 'El usuario debe tener al menos 3 caracteres')
    .max(30, 'El usuario no puede exceder 30 caracteres')
    .regex(/^[a-zA-Z0-9_]+$/, 'Solo letras, números y guión bajo'),
  password: z
    .string()
    .min(8, 'La contraseña debe tener al menos 8 caracteres')
    .max(100)
    .optional()
    .or(z.literal('')),
  photo: z.string().max(500).optional().or(z.literal('')),
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
  isActive: z.boolean().optional(),
});

export type UpdateUserByOwnerInput = z.infer<typeof updateUserByOwnerSchema>;
