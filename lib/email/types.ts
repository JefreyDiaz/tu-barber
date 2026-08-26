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

export interface TenantRegistrationReceivedPayload {
  shopName: string;
  slug: string;
  plan: string;
  ownerName: string;
  ownerEmail: string;
}

export interface TenantApprovedPayload {
  shopName: string;
  slug: string;
  plan: string;
  ownerName: string;
  ownerEmail: string;
  username: string;
}

export interface SubscriptionExpiringAdminPayload {
  shopName: string;
  slug: string;
  plan: string;
  ownerName: string;
  ownerEmail: string;
  ownerPhone: string;
  periodEnd: Date;
  timezone: string;
  subscriptionStatus: string;
}

export interface SubscriptionExpiringOwnerPayload {
  shopName: string;
  slug: string;
  plan: string;
  ownerName: string;
  ownerEmail: string;
  periodEnd: Date;
  timezone: string;
  subscriptionStatus: string;
}

export interface BarberNewBookingEmailPayload {
  shopName: string;
  slug: string;
  toEmail: string;
  barberName: string;
  customerName: string;
  customerPhone: string;
  serviceName: string;
  dateTime: Date;
}
