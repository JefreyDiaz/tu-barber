import { z } from 'zod';
import type { ResendConfig } from './types';

const emailSchema = z.string().trim().email();

function parseRecipientList(raw: string | undefined): string[] {
  if (!raw?.trim()) return [];

  const seen = new Set<string>();
  const recipients: string[] = [];

  for (const part of raw.split(',')) {
    const email = part.trim();
    if (!email || !emailSchema.safeParse(email).success) continue;
    const key = email.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    recipients.push(email);
  }

  return recipients;
}

export function getResendConfig(): ResendConfig | null {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM;
  const notifyTo = parseRecipientList(process.env.RESEND_TENANT_NOTIFY_TO);

  if (!apiKey || !from || notifyTo.length === 0) return null;

  return { apiKey, from, notifyTo };
}

export function getPlatformAppUrl(): string {
  const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN;
  if (rootDomain && !rootDomain.includes('localhost')) {
    return `https://${rootDomain}`;
  }
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, '');
  }
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  }
  return 'http://localhost:3000';
}
