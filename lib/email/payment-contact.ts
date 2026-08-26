export function getSubscriptionPaymentContact(): string {
  const raw = process.env.SUBSCRIPTION_PAYMENT_PHONES?.trim();
  if (!raw) return 'contacta a TuBarber por correo o WhatsApp';
  return raw
    .split(',')
    .map((p) => p.trim())
    .filter(Boolean)
    .join(' · ');
}
