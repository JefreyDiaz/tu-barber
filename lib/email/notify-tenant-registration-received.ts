import { Resend } from 'resend';
import { PLATFORM_LOGO, PLATFORM_LOGO_ALT } from '@/lib/brand';
import { getPlanName, TRIAL_DAYS } from '@/lib/plans';
import { formatTenantHost } from '@/lib/tenant/urls';
import { getPlatformAppUrl, getResendSendConfig } from './get-config';
import type { TenantRegistrationReceivedPayload } from './types';

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

function buildTenantRegistrationReceivedHtml(payload: TenantRegistrationReceivedPayload): string {
  const platformUrl = getPlatformAppUrl();
  const logoUrl = `${platformUrl}${PLATFORM_LOGO.logoSm || PLATFORM_LOGO.logo}`;
  const planName = getPlanName(payload.plan);
  const tenantHost = formatTenantHost(payload.slug);

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Solicitud recibida — TuBarber</title>
</head>
<body style="margin:0;padding:0;background:#eceff3;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#eceff3;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:600px;">
          <tr>
            <td style="background:linear-gradient(135deg,#0c0c0c 0%,#1a1a1a 100%);border-radius:16px 16px 0 0;padding:28px 32px 24px;border:1px solid #262626;border-bottom:none;">
              <img src="${escapeAttr(logoUrl)}" alt="${escapeAttr(PLATFORM_LOGO_ALT)}" width="140" height="auto" style="display:block;border:0;max-width:140px;height:auto;" />
              <h1 style="margin:20px 0 0;font-size:24px;line-height:1.3;font-weight:700;color:#ffffff;letter-spacing:-0.02em;">
                ¡Recibimos tu solicitud!
              </h1>
              <p style="margin:8px 0 0;font-size:15px;line-height:1.5;color:#a3a3a3;">
                Hola <strong style="color:#f5f5f5;">${escapeHtml(payload.ownerName)}</strong>, gracias por registrar <strong style="color:#f5f5f5;">${escapeHtml(payload.shopName)}</strong>.
              </p>
            </td>
          </tr>

          <tr>
            <td style="background:#ffffff;padding:28px 32px;border-left:1px solid #e5e7eb;border-right:1px solid #e5e7eb;">
              <p style="margin:0 0 16px;font-size:15px;line-height:1.65;color:#374151;">
                Tu información está siendo revisada por nuestro equipo. En breve nos pondremos en contacto contigo para confirmar la activación de tu barbería.
              </p>
              <p style="margin:0 0 24px;font-size:15px;line-height:1.65;color:#374151;">
                No necesitas hacer nada más por ahora. Te avisaremos por este correo y por WhatsApp cuando tu cuenta esté lista.
              </p>

              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#fafafa;border:1px solid #e5e7eb;border-radius:12px;">
                <tr>
                  <td style="padding:20px 22px;">
                    <p style="margin:0 0 12px;font-size:12px;font-weight:600;letter-spacing:0.04em;text-transform:uppercase;color:#9ca3af;">Resumen de tu solicitud</p>
                    <p style="margin:0 0 8px;font-size:15px;line-height:1.5;color:#111827;">
                      <strong>Barbería:</strong> ${escapeHtml(payload.shopName)}
                    </p>
                    <p style="margin:0 0 8px;font-size:15px;line-height:1.5;color:#111827;">
                      <strong>Plan:</strong> ${escapeHtml(planName)}
                    </p>
                    <p style="margin:0 0 8px;font-size:15px;line-height:1.5;color:#111827;">
                      <strong>URL reservada:</strong>
                      <span style="font-family:ui-monospace,Consolas,monospace;font-size:13px;color:#92400e;">${escapeHtml(tenantHost)}</span>
                    </p>
                    <p style="margin:0;font-size:14px;line-height:1.5;color:#92400e;">
                      Al activarte recibirás ${TRIAL_DAYS} días de prueba gratis.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td style="background:#fafafa;border-radius:0 0 16px 16px;padding:20px 32px;border:1px solid #e5e7eb;border-top:none;text-align:center;">
              <p style="margin:0;font-size:12px;line-height:1.6;color:#9ca3af;">
                Equipo <strong style="color:#6b7280;">TuBarber</strong><br />
                <a href="${escapeAttr(platformUrl)}" style="color:#d97706;text-decoration:none;">${escapeHtml(platformUrl)}</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/**
 * Confirms to the tenant owner that their onboarding request was received.
 * Returns false if email is not configured or sending fails; does not throw.
 */
export async function notifyTenantRegistrationReceived(
  payload: TenantRegistrationReceivedPayload
): Promise<boolean> {
  const config = getResendSendConfig();
  if (!config) {
    console.warn(
      '[Resend] Skipping tenant registration confirmation: RESEND_API_KEY or RESEND_FROM not configured'
    );
    return false;
  }

  const resend = new Resend(config.apiKey);

  try {
    const { error } = await resend.emails.send({
      from: config.from,
      to: payload.ownerEmail,
      subject: `TuBarber — Recibimos tu solicitud (${payload.shopName})`,
      html: buildTenantRegistrationReceivedHtml(payload),
    });

    if (error) {
      console.error('[Resend] tenant registration confirmation failed:', error);
      return false;
    }

    return true;
  } catch (err) {
    console.error('[Resend] tenant registration confirmation error:', err);
    return false;
  }
}
