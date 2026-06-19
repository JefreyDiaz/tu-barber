export interface ManyChatFieldMap {
  customerName?: string;
  barberName?: string;
  bookingDate?: string;
  bookingTime?: string;
  barberPhone?: string;
  cancelUrl?: string;
  customerPhone?: string;
}

export interface ManyChatConfig {
  apiKey: string;
  flowBooking?: string;
  flowBarber?: string;
  flowReminder?: string;
  fieldMap: ManyChatFieldMap;
}

export interface BookingMessageParams {
  to: string;
  customerName: string;
  barberName: string;
  barberPhone?: string | null;
  dateTime: Date;
  bookingId: string;
  tenantSlug?: string;
}

export interface BarberMessageParams {
  barberPhone: string;
  barberName: string;
  customerName: string;
  customerPhone: string;
  dateTime: Date;
}

export interface BookingFieldData {
  customerName: string;
  barberName: string;
  bookingDate: string;
  bookingTime: string;
  barberPhone: string;
  cancelUrl: string;
  customerPhone?: string;
}
