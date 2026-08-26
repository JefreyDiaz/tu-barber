import { Resend } from 'resend';
import { formatColombiaDate, formatColombiaTime } from '@/lib/date-utils';
import { PLATFORM_LOGO, PLATFORM_LOGO_ALT } from '@/lib/brand';
import { buildTenantUrl } from '@/lib/tenant/urls';
import { formatLocalPhoneDigits } from '@/lib/messaging/phone';
import { getPlatformAppUrl, getResendSendConfig } from './get-config';
import type { BarberNewBookingEmailPayload } from './types';

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function escapeAttr(value: string): string {
  return escapeHtml(value);
}

function buildBarberNewBookingHtml(payload: BarberNewBookingEmailPayload): string {
  const platformUrl = getPlatformAppUrl();
  const logoUrl = `${platformUrl}${PLATFORM_LOGO.logoSm || PLATFORM_LOGO.logo}`;
  const adminBookingsUrl = buildTenantUrl(payload.slug, '/admin/bookings');
  const phoneDisplay = formatLocalPhoneDigits(payload.customerPhone);

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Nueva reserva — ${escapeHtml(payload.shopName)}</title>
</head>
<body style="margin:0;padding:0;background:#eceff3;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#eceff3;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:600px;">
          <tr>
            <td style="background:linear-gradient(135deg,#0c0c0c 0%,#1a1a1a 100%);border-radius:16px 16px 0 0;padding:28px 32px 24px;border:1px solid #262626;border-bottom:none;">
              <img src="${escapeAttr(logoUrl)}" alt="${escapeAttr(PLATFORM_LOGO_ALT)}" width="140" height="auto" style="display:block;border:0;max-width:140px;height:auto;" />
              <h1 style="margin:20px 0 0;font-size:24px;line-height:1.3;font-weight:700;color:#ffffff;">
                Nueva reserva
              </h1>
              <p style="margin:8px 0 0;font-size:15px;line-height:1.5;color:#a3a3a3;">
                <strong style="color:#f5f5f5;">${escapeHtml(payload.shopName)}</strong> tiene una cita nueva.
              </p>
            </td>
          </tr>
          <tr>
            <td style="background:#ffffff;padding:28px 32px;border-left:1px solid #e5e7eb;border-right:1px solid #e5e7eb;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#fafafa;border:1px solid #e5e7eb;border-radius:12px;">
                <tr>
                  <td style="padding:20px 22px;">
                    <p style="margin:0 0 8px;font-size:15px;color:#111827;"><strong>Barbero:</strong> ${escapeHtml(payload.barberName)}</p>
                    <p style="margin:0 0 8px;font-size:15px;color:#111827;"><strong>Cliente:</strong> ${escapeHtml(payload.customerName)}</p>
                    <p style="margin:0 0 8px;font-size:15px;color:#111827;"><strong>Teléfono:</strong> ${escapeHtml(phoneDisplay)}</p>
                    <p style="margin:0 0 8px;font-size:15px;color:#111827;"><strong>Servicio:</strong> ${escapeHtml(payload.serviceName)}</p>
                    <p style="margin:0 0 8px;font-size:15px;color:#111827;"><strong>Fecha:</strong> ${escapeHtml(formatColombiaDate(payload.dateTime))}</p>
                    <p style="margin:0;font-size:15px;color:#111827;"><strong>Hora:</strong> ${escapeHtml(formatColombiaTime(payload.dateTime))}</p>
                  </td>
                </tr>
              </table>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-top:24px;">
                <tr>
                  <td align="center">
                    <a href="${escapeAttr(adminBookingsUrl)}" style="display:inline-block;padding:14px 28px;background:linear-gradient(135deg,#f59e0b 0%,#d97706 100%);color:#ffffff;text-decoration:none;border-radius:10px;font-weight:700;font-size:15px;">
                      Ver reservas en el panel →
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="background:#fafafa;border-radius:0 0 16px 16px;padding:20px 32px;border:1px solid #e5e7eb;border-top:none;text-align:center;">
              <p style="margin:0;font-size:12px;color:#9ca3af;">Notificación automática · TuBarber</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/** Notifies tenant (owner email) about a new booking for a barber. */
export async function notifyBarberNewBooking(
  payload: BarberNewBookingEmailPayload
): Promise<boolean> {
  const config = getResendSendConfig();
  if (!config) {
    console.warn('[Resend] Skipping barber booking alert: RESEND not configured');
    return false;
  }

  const resend = new Resend(config.apiKey);

  try {
    const { error } = await resend.emails.send({
      from: config.from,
      to: payload.toEmail,
      subject: `[${payload.shopName}] Nueva reserva con ${payload.barberName}`,
      html: buildBarberNewBookingHtml(payload),
    });

    if (error) {
      console.error('[Resend] barber new booking email failed:', error);
      return false;
    }
    return true;
  } catch (err) {
    console.error('[Resend] barber new booking email error:', err);
    return false;
  }
}
