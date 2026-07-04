import { formatDateForDisplay } from '@/lib/dates/timezone';
import { getPlanDefinition, getPlanName } from '@/lib/plans';
import { getPlatformTwilioConfig } from './get-config';
import { sendTwilioTemplateMessage } from './twilio';

export interface SubscriptionRenewalMessageParams {
  ownerPhone: string;
  ownerName: string;
  shopName: string;
  planId: string;
  periodEnd: Date;
  timezone: string;
  subscriptionStatus: string;
}

function getPaymentPhonesDisplay(): string {
  const raw = process.env.SUBSCRIPTION_PAYMENT_PHONES?.trim();
  if (!raw) return 'contacta a TuBarber por WhatsApp';
  return raw
    .split(',')
    .map((p) => p.trim())
    .filter(Boolean)
    .join(' · ');
}

function periodTypeLabel(subscriptionStatus: string): string {
  return subscriptionStatus === 'trialing' ? 'período de prueba' : 'suscripción mensual';
}

/**
 * Reminds tenant owner to renew before period ends.
 * Template variables:
 * 1=ownerName, 2=shopName, 3=periodType, 4=expiresDate, 5=paymentPhones, 6=planPrice
 */
export async function sendSubscriptionRenewalReminder(
  params: SubscriptionRenewalMessageParams
): Promise<boolean> {
  const config = getPlatformTwilioConfig();
  const contentSid =
    process.env.TWILIO_CONTENT_SID_RENEWAL ??
    process.env.TWILIO_WHATSAPP_RENEWAL_TEMPLATE_SID;

  if (!config) {
    console.warn('[Twilio] Platform config missing for renewal reminder');
    return false;
  }

  if (!contentSid) {
    console.warn('[Twilio] Renewal template not configured (TWILIO_CONTENT_SID_RENEWAL)');
    return false;
  }

  const plan = getPlanDefinition(params.planId);
  const expiresDate = formatDateForDisplay(params.periodEnd, params.timezone);

  return sendTwilioTemplateMessage(config, params.ownerPhone, contentSid, [
    params.ownerName,
    params.shopName,
    periodTypeLabel(params.subscriptionStatus),
    expiresDate,
    getPaymentPhonesDisplay(),
    `${plan.priceLabel}/mes (${getPlanName(params.planId)})`,
  ]);
}
