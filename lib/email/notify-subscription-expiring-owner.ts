import { Resend } from 'resend';
import { PLATFORM_LOGO, PLATFORM_LOGO_ALT } from '@/lib/brand';
import { formatDateForDisplay } from '@/lib/dates/timezone';
import { getPlanDefinition, getPlanName } from '@/lib/plans';
import { buildTenantUrl } from '@/lib/tenant/urls';
import { getPlatformAppUrl, getResendSendConfig } from './get-config';
import { getSubscriptionPaymentContact } from './payment-contact';
import type { SubscriptionExpiringOwnerPayload } from './types';

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

function periodTypeLabel(subscriptionStatus: string): string {
  return subscriptionStatus === 'trialing' ? 'período de prueba' : 'suscripción mensual';
}

function buildSubscriptionExpiringOwnerHtml(payload: SubscriptionExpiringOwnerPayload): string {
  const platformUrl = getPlatformAppUrl();
  const logoUrl = `${platformUrl}${PLATFORM_LOGO.logoSm || PLATFORM_LOGO.logo}`;
  const loginUrl = buildTenantUrl(payload.slug, '/login');
  const planName = getPlanName(payload.plan);
  const planPrice = getPlanDefinition(payload.plan).priceLabel;
  const expiresLabel = formatDateForDisplay(payload.periodEnd, payload.timezone);
  const periodType = periodTypeLabel(payload.subscriptionStatus);
  const paymentContact = getSubscriptionPaymentContact();

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Vencimiento mañana — TuBarber</title>
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
                Tu ${periodType} vence mañana
              </h1>
              <p style="margin:8px 0 0;font-size:15px;line-height:1.5;color:#a3a3a3;">
                Hola <strong style="color:#f5f5f5;">${escapeHtml(payload.ownerName)}</strong>, renueva <strong style="color:#f5f5f5;">${escapeHtml(payload.shopName)}</strong> para seguir recibiendo reservas.
              </p>
            </td>
          </tr>
          <tr>
            <td style="background:#ffffff;padding:28px 32px;border-left:1px solid #e5e7eb;border-right:1px solid #e5e7eb;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#fffbeb;border:1px solid #fde68a;border-radius:12px;">
                <tr>
                  <td style="padding:20px 22px;">
                    <p style="margin:0 0 8px;font-size:15px;color:#111827;"><strong>Plan:</strong> ${escapeHtml(planName)} (${escapeHtml(planPrice)}/mes)</p>
                    <p style="margin:0 0 8px;font-size:15px;color:#111827;"><strong>Vence:</strong> ${escapeHtml(expiresLabel)}</p>
                    <p style="margin:0;font-size:15px;color:#111827;"><strong>Pago:</strong> ${escapeHtml(paymentContact)}</p>
                  </td>
                </tr>
              </table>
              <p style="margin:16px 0 0;font-size:14px;line-height:1.6;color:#6b7280;">
                Realiza el pago antes de la fecha de vencimiento para evitar interrupciones en tu sitio y panel de administración.
              </p>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-top:24px;">
                <tr>
                  <td align="center">
                    <a href="${escapeAttr(loginUrl)}" style="display:inline-block;padding:14px 28px;background:linear-gradient(135deg,#f59e0b 0%,#d97706 100%);color:#ffffff;text-decoration:none;border-radius:10px;font-weight:700;font-size:15px;">
                      Ir al panel →
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="background:#fafafa;border-radius:0 0 16px 16px;padding:20px 32px;border:1px solid #e5e7eb;border-top:none;text-align:center;">
              <p style="margin:0;font-size:12px;color:#9ca3af;">Equipo TuBarber</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/** Reminds tenant owner by email before trial/subscription ends. */
export async function notifySubscriptionExpiringOwner(
  payload: SubscriptionExpiringOwnerPayload
): Promise<boolean> {
  const config = getResendSendConfig();
  if (!config) {
    console.warn('[Resend] Skipping subscription expiry owner email: RESEND not configured');
    return false;
  }

  const resend = new Resend(config.apiKey);
  const periodLabel =
    payload.subscriptionStatus === 'trialing' ? 'prueba' : 'suscripción';

  try {
    const { error } = await resend.emails.send({
      from: config.from,
      to: payload.ownerEmail,
      subject: `TuBarber — Tu ${periodLabel} vence mañana (${payload.shopName})`,
      html: buildSubscriptionExpiringOwnerHtml(payload),
    });

    if (error) {
      console.error('[Resend] subscription expiry owner email failed:', error);
      return false;
    }
    return true;
  } catch (err) {
    console.error('[Resend] subscription expiry owner email error:', err);
    return false;
  }
}
