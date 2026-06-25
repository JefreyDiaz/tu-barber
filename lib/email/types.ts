export interface ResendConfig {
  apiKey: string;
  from: string;
  notifyTo: string[];
}

export interface NewTenantNotificationPayload {
  tenantId: string;
  shopName: string;
  slug: string;
  plan: string;
  ownerName: string;
  ownerEmail: string;
  ownerPhone: string;
  username: string;
}
