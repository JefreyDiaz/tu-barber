import { getPlanDefinition, TRIAL_DAYS } from '@/lib/plans';
import { getPlatformTwilioConfig, getTenantAppUrl } from './get-config';
import { sendTwilioTemplateMessage } from './twilio';

export interface TenantWelcomeMessageParams {
  ownerPhone: string;
  ownerName: string;
  shopName: string;
  tenantSlug: string;
  planId: string;
  username: string;
}

/** {{3}} in welcome template: plan + trial + price after trial */
export function formatWelcomePlanSummary(planId: string): string {
  const plan = getPlanDefinition(planId);
  return `Plan ${plan.name} · ${TRIAL_DAYS} días gratis · Luego ${plan.priceLabel}/mes`;
}

/**
 * Send welcome WhatsApp to tenant owner on platform approval.
 * Template variables: 1=ownerName, 2=shopName, 3=planSummary, 4=adminLoginUrl, 5=username, 6=bookingUrl
 */
export async function sendTenantWelcomeMessage(params: TenantWelcomeMessageParams): Promise<void> {
  const config = getPlatformTwilioConfig();

  if (!config?.contentSidWelcome) {
    console.log('[Twilio] Welcome template not configured (TWILIO_CONTENT_SID_WELCOME)');
    return;
  }

  const tenantUrl = getTenantAppUrl(params.tenantSlug);
  const adminLoginUrl = `${tenantUrl}/login`;

  await sendTwilioTemplateMessage(config, params.ownerPhone, config.contentSidWelcome, [
    params.ownerName,
    params.shopName,
    formatWelcomePlanSummary(params.planId),
    adminLoginUrl,
    params.username,
    tenantUrl,
  ]);
}
