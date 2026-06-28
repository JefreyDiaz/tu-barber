import { z } from 'zod';

/** Letters, digits, underscore, hyphen — no spaces. */
export const USERNAME_REGEX = /^[a-zA-Z0-9_-]+$/;

export const usernameSchema = z
  .string()
  .trim()
  .min(3, 'Mínimo 3 caracteres')
  .max(30, 'Máximo 30 caracteres')
  .regex(USERNAME_REGEX, 'Solo letras, números, guión (-) y guión bajo (_)');

/** Strips spaces and disallowed characters while typing. */
export function sanitizeUsernameInput(value: string): string {
  return value.toLowerCase().replace(/\s/g, '').replace(/[^a-z0-9_-]/g, '');
}

export function isUsernameValid(value: string): boolean {
  const trimmed = value.trim();
  return trimmed.length >= 3 && trimmed.length <= 30 && USERNAME_REGEX.test(trimmed);
}
