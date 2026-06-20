import { getPlatformTwilioConfig } from './get-config';
import { sendTwilioTemplateMessage } from './twilio';

/** Send welcome WhatsApp to new tenant owner on approval */
export async function sendTenantWelcomeMessage(params: {
  ownerPhone: string;
  ownerName: string;
  shopName: string;
  tenantSlug: string;
}): Promise<void> {
  const config = getPlatformTwilioConfig();

  if (!config?.contentSidWelcome) {
    console.log('[Twilio] Welcome template not configured (TWILIO_CONTENT_SID_WELCOME)');
    return;
  }

  const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? 'tubarber.com';
  const tenantUrl = rootDomain.includes('localhost')
    ? `http://localhost:3000?tenant=${params.tenantSlug}`
    : `https://${params.tenantSlug}.${rootDomain}`;

  await sendTwilioTemplateMessage(config, params.ownerPhone, config.contentSidWelcome, [
    params.ownerName,
    params.shopName,
    tenantUrl,
  ]);
}
