import { getTenantAppUrl, resolveTwilioConfig } from './get-config';
import { sendTwilioTemplateMessage } from './twilio';
import type { TenantTwilioSettings } from './types';
import type { TenantSubscription } from '@/lib/tenant/subscription';

export interface ReengagementMessageParams {
  to: string;
  customerName: string;
  shopName: string;
  tenantSlug: string;
}

/**
 * Monthly "come back" WhatsApp to a past customer.
 * Template variables: {{1}} name, {{2}} shop, {{3}} booking URL.
 */
export async function sendCustomerReengagementMessage(
  params: ReengagementMessageParams,
  tenantSettings?: TenantTwilioSettings | null,
  tenant?: TenantSubscription | null
): Promise<boolean> {
  const config = resolveTwilioConfig(tenantSettings, tenant);
  if (!config?.contentSidReengagement) {
    console.warn('[Twilio] TWILIO_CONTENT_SID_REENGAGEMENT not configured');
    return false;
  }

  const bookingUrl = getTenantAppUrl(params.tenantSlug);
  const variables = [params.customerName, params.shopName, bookingUrl];

  return sendTwilioTemplateMessage(
    config,
    params.to,
    config.contentSidReengagement,
    variables
  );
}
