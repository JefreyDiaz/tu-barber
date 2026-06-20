const DEFAULT_COUNTRY_CODE = '57';

/** Normalize to E.164 for Colombia (+57 + 10 digits). */
export function toE164(phone: string, countryCode = DEFAULT_COUNTRY_CODE): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 10) return `+${countryCode}${digits}`;
  if (digits.startsWith(countryCode) && digits.length === 12) return `+${digits}`;
  if (digits.startsWith('57') && digits.length >= 11) return `+${digits}`;
  if (phone.startsWith('+')) return phone;
  return `+${digits}`;
}

export function toWhatsAppAddress(phone: string): string {
  const e164 = toE164(phone);
  return e164.startsWith('whatsapp:') ? e164 : `whatsapp:${e164}`;
}

export function normalizeWhatsappFrom(from: string): string {
  const trimmed = from.trim();
  if (trimmed.startsWith('whatsapp:')) return trimmed;
  if (trimmed.startsWith('+')) return `whatsapp:${trimmed}`;
  return `whatsapp:+${trimmed.replace(/\D/g, '')}`;
}
