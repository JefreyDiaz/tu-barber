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

export function getResendSendConfig(): { apiKey: string; from: string } | null {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM;
  if (!apiKey || !from) return null;
  return { apiKey, from };
}

/** Reply-To for transactional mail — Outlook rejects no-reply without a valid reply address. */
export function getResendReplyTo(): string | undefined {
  const explicit = process.env.RESEND_REPLY_TO?.trim();
  if (explicit && emailSchema.safeParse(explicit).success) return explicit;

  const from = process.env.RESEND_FROM?.trim();
  if (!from) return undefined;

  const bracketMatch = from.match(/<([^>]+)>/);
  const candidate = bracketMatch?.[1]?.trim() ?? from;
  if (emailSchema.safeParse(candidate).success) return candidate;

  return undefined;
}

export function getResendConfig(): ResendConfig | null {
  const sendConfig = getResendSendConfig();
  const notifyTo = parseRecipientList(process.env.RESEND_TENANT_NOTIFY_TO);
  if (!sendConfig || notifyTo.length === 0) return null;
  return { ...sendConfig, notifyTo };
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
