import { Resend } from 'resend';
import { PLATFORM_LOGO, PLATFORM_LOGO_ALT } from '@/lib/brand';
import { formatDateForDisplay } from '@/lib/dates/timezone';
import { getPlanName, getPlanDefinition } from '@/lib/plans';
import { buildTenantUrl, formatTenantHost } from '@/lib/tenant/urls';
import { getPlatformAppUrl, getResendConfig } from './get-config';
import type { SubscriptionExpiringAdminPayload } from './types';

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

function buildSubscriptionExpiringAdminHtml(payload: SubscriptionExpiringAdminPayload): string {
  const platformUrl = getPlatformAppUrl();
  const tenantsUrl = `${platformUrl}/platform/tenants`;
  const logoUrl = `${platformUrl}${PLATFORM_LOGO.logoSm || PLATFORM_LOGO.logo}`;
  const tenantUrl = buildTenantUrl(payload.slug, '/');
  const planName = getPlanName(payload.plan);
  const planPrice = getPlanDefinition(payload.plan).priceLabel;
  const expiresLabel = formatDateForDisplay(payload.periodEnd, payload.timezone);
  const periodType =
    payload.subscriptionStatus === 'trialing' ? 'Período de prueba' : 'Suscripción mensual';

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
                Vencimiento mañana
              </h1>
              <p style="margin:8px 0 0;font-size:15px;line-height:1.5;color:#a3a3a3;">
                A <strong style="color:#fbbf24;">${escapeHtml(payload.shopName)}</strong> se le vence el ${periodType.toLowerCase()} mañana.
              </p>
            </td>
          </tr>
          <tr>
            <td style="background:#ffffff;padding:28px 32px;border-left:1px solid #e5e7eb;border-right:1px solid #e5e7eb;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#fffbeb;border:1px solid #fde68a;border-radius:12px;">
                <tr>
                  <td style="padding:20px 22px;">
                    <p style="margin:0 0 8px;font-size:15px;color:#111827;"><strong>Barbería:</strong> ${escapeHtml(payload.shopName)}</p>
                    <p style="margin:0 0 8px;font-size:15px;color:#111827;"><strong>Dueño:</strong> ${escapeHtml(payload.ownerName)}</p>
                    <p style="margin:0 0 8px;font-size:15px;color:#111827;"><strong>Email:</strong> <a href="mailto:${escapeAttr(payload.ownerEmail)}" style="color:#d97706;text-decoration:none;">${escapeHtml(payload.ownerEmail)}</a></p>
                    <p style="margin:0 0 8px;font-size:15px;color:#111827;"><strong>Teléfono:</strong> ${escapeHtml(payload.ownerPhone)}</p>
                    <p style="margin:0 0 8px;font-size:15px;color:#111827;"><strong>Plan:</strong> ${escapeHtml(planName)} (${escapeHtml(planPrice)}/mes)</p>
                    <p style="margin:0 0 8px;font-size:15px;color:#111827;"><strong>${escapeHtml(periodType)} vence:</strong> ${escapeHtml(expiresLabel)}</p>
                    <p style="margin:0;font-size:14px;color:#6b7280;"><strong>URL:</strong> <a href="${escapeAttr(tenantUrl)}" style="color:#d97706;text-decoration:none;">${escapeHtml(formatTenantHost(payload.slug))}</a></p>
                  </td>
                </tr>
              </table>
              <p style="margin:20px 0 0;font-size:14px;line-height:1.6;color:#6b7280;">
                El cliente ya recibió un recordatorio por WhatsApp con los datos de pago. Confirma el abono y usa <strong>Registrar pago</strong> en el panel para extender su período.
              </p>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-top:24px;">
                <tr>
                  <td align="center">
                    <a href="${escapeAttr(tenantsUrl)}" style="display:inline-block;padding:14px 28px;background:linear-gradient(135deg,#f59e0b 0%,#d97706 100%);color:#ffffff;text-decoration:none;border-radius:10px;font-weight:700;font-size:15px;">
                      Ver tenants →
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

export async function notifySubscriptionExpiringAdmin(
  payload: SubscriptionExpiringAdminPayload
): Promise<boolean> {
  const config = getResendConfig();
  if (!config) {
    console.warn('[Resend] Skipping subscription expiry admin alert: email not configured');
    return false;
  }

  const resend = new Resend(config.apiKey);
  const periodLabel =
    payload.subscriptionStatus === 'trialing' ? 'prueba' : 'suscripción';

  try {
    const { error } = await resend.emails.send({
      from: config.from,
      to: config.notifyTo,
      subject: `[TuBarber] Vence mañana: ${payload.shopName} (${periodLabel})`,
      html: buildSubscriptionExpiringAdminHtml(payload),
    });

    if (error) {
      console.error('[Resend] subscription expiry admin alert failed:', error);
      return false;
    }
    return true;
  } catch (err) {
    console.error('[Resend] subscription expiry admin alert error:', err);
    return false;
  }
}
