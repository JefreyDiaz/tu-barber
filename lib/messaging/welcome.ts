import { getPlatformManyChatConfig } from './get-config';
import { sendManyChatMessage } from './manychat';

/** Send welcome WhatsApp to new tenant owner on approval (optional flow) */
export async function sendTenantWelcomeMessage(params: {
  ownerPhone: string;
  ownerName: string;
  shopName: string;
  tenantSlug: string;
}): Promise<void> {
  const flowWelcome = process.env.MANYCHAT_FLOW_WELCOME;
  const config = getPlatformManyChatConfig();

  if (!config || !flowWelcome) {
    console.log('[ManyChat] Welcome flow not configured (MANYCHAT_FLOW_WELCOME)');
    return;
  }

  const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? 'tubarber.com';
  const tenantUrl = rootDomain.includes('localhost')
    ? `http://localhost:3000?tenant=${params.tenantSlug}`
    : `https://${params.tenantSlug}.${rootDomain}`;

  await sendManyChatMessage(
    { ...config, flowBooking: flowWelcome },
    params.ownerPhone,
    flowWelcome,
    {
      customerName: params.ownerName,
      barberName: params.shopName,
      bookingDate: '',
      bookingTime: '',
      barberPhone: '',
      cancelUrl: tenantUrl,
      customerPhone: params.ownerPhone.replace(/\D/g, ''),
    },
    params.ownerName
  );
}
