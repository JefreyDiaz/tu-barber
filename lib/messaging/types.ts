export interface TwilioConfig {
  accountSid: string;
  authToken: string;
  whatsappFrom: string;
  contentSidBooking?: string;
  contentSidBarber?: string;
  contentSidReminder?: string;
  contentSidWelcome?: string;
}

export interface TenantTwilioSettings {
  twilioAccountSid?: string | null;
  twilioAuthToken?: string | null;
  twilioWhatsappFrom?: string | null;
  twilioContentSidBooking?: string | null;
  twilioContentSidBarber?: string | null;
  twilioContentSidReminder?: string | null;
}

export interface BookingMessageParams {
  to: string;
  customerName: string;
  barberName: string;
  barberPhone?: string | null;
  dateTime: Date;
  bookingId: string;
  tenantSlug?: string;
  shopName?: string;
}

export interface BarberMessageParams {
  barberPhone: string;
  barberName: string;
  customerName: string;
  customerPhone: string;
  dateTime: Date;
}
