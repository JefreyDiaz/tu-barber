import { Resend } from 'resend';
import { PLATFORM_LOGO, PLATFORM_LOGO_ALT } from '@/lib/brand';
import { formatWelcomePlanSummary } from '@/lib/plans';
import { buildTenantUrl, formatTenantHost } from '@/lib/tenant/urls';
import { getPlatformAppUrl, getResendSendConfig } from './get-config';
import type { TenantApprovedPayload } from './types';

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

function buildTenantApprovedHtml(payload: TenantApprovedPayload): string {
  const platformUrl = getPlatformAppUrl();
  const logoUrl = `${platformUrl}${PLATFORM_LOGO.logoSm || PLATFORM_LOGO.logo}`;
  const tenantUrl = buildTenantUrl(payload.slug, '/');
  const loginUrl = buildTenantUrl(payload.slug, '/login');
  const tenantHost = formatTenantHost(payload.slug);
  const planSummary = formatWelcomePlanSummary(payload.plan);

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Cuenta activada — TuBarber</title>
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
                ¡Tu barbería está activa!
              </h1>
              <p style="margin:8px 0 0;font-size:15px;line-height:1.5;color:#a3a3a3;">
                Hola <strong style="color:#f5f5f5;">${escapeHtml(payload.ownerName)}</strong>, aprobamos <strong style="color:#f5f5f5;">${escapeHtml(payload.shopName)}</strong> en TuBarber.
              </p>
            </td>
          </tr>

          <tr>
            <td style="background:#ffffff;padding:28px 32px;border-left:1px solid #e5e7eb;border-right:1px solid #e5e7eb;">
              <p style="margin:0 0 16px;font-size:15px;line-height:1.65;color:#374151;">
                Ya puedes ingresar al panel de administración, configurar tu barbería y empezar a recibir reservas.
              </p>

              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#fafafa;border:1px solid #e5e7eb;border-radius:12px;">
                <tr>
                  <td style="padding:20px 22px;">
                    <p style="margin:0 0 12px;font-size:12px;font-weight:600;letter-spacing:0.04em;text-transform:uppercase;color:#9ca3af;">Datos de acceso</p>
                    <p style="margin:0 0 8px;font-size:15px;line-height:1.5;color:#111827;">
                      <strong>Usuario:</strong>
                      <code style="font-family:ui-monospace,Consolas,monospace;font-size:13px;background:#fff;border:1px solid #e5e7eb;border-radius:6px;padding:2px 8px;color:#374151;">${escapeHtml(payload.username)}</code>
                    </p>
                    <p style="margin:0 0 8px;font-size:15px;line-height:1.5;color:#111827;">
                      <strong>Plan:</strong> ${escapeHtml(planSummary)}
                    </p>
                    <p style="margin:0 0 8px;font-size:15px;line-height:1.5;color:#111827;">
                      <strong>Sitio público:</strong>
                      <a href="${escapeAttr(tenantUrl)}" style="color:#d97706;text-decoration:none;word-break:break-all;">${escapeHtml(tenantHost)}</a>
                    </p>
                    <p style="margin:0;font-size:14px;line-height:1.5;color:#6b7280;">
                      Usa la contraseña que registraste al crear tu cuenta.
                    </p>
                  </td>
                </tr>
              </table>

              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-top:24px;">
                <tr>
                  <td align="center">
                    <a href="${escapeAttr(loginUrl)}" style="display:inline-block;padding:14px 28px;background:linear-gradient(135deg,#f59e0b 0%,#d97706 100%);color:#ffffff;text-decoration:none;border-radius:10px;font-weight:700;font-size:15px;letter-spacing:0.01em;box-shadow:0 4px 14px rgba(217,119,6,0.35);">
                      Ir al panel de administración →
                    </a>
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
 * Sends welcome email to tenant owner when their account is approved.
 * Returns false if email is not configured or sending fails; does not throw.
 */
export async function notifyTenantApproved(payload: TenantApprovedPayload): Promise<boolean> {
  const config = getResendSendConfig();
  if (!config) {
    console.warn(
      '[Resend] Skipping tenant approval email: RESEND_API_KEY or RESEND_FROM not configured'
    );
    return false;
  }

  const resend = new Resend(config.apiKey);

  try {
    const { error } = await resend.emails.send({
      from: config.from,
      to: payload.ownerEmail,
      subject: `TuBarber — ¡Tu barbería está activa! (${payload.shopName})`,
      html: buildTenantApprovedHtml(payload),
    });

    if (error) {
      console.error('[Resend] tenant approval email failed:', error);
      return false;
    }

    return true;
  } catch (err) {
    console.error('[Resend] tenant approval email error:', err);
    return false;
  }
}
