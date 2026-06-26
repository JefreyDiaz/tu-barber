import { Resend } from 'resend';
import { PLATFORM_LOGO, PLATFORM_LOGO_ALT } from '@/lib/brand';
import { getPlanName } from '@/lib/plans';
import { buildTenantUrl } from '@/lib/tenant/urls';
import { getPlatformAppUrl, getResendConfig } from './get-config';
import type { NewTenantNotificationPayload } from './types';

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

function buildNewTenantEmailHtml(payload: NewTenantNotificationPayload): string {
  const platformUrl = getPlatformAppUrl();
  const tenantsUrl = `${platformUrl}/platform/tenants`;
  const logoUrl = `${platformUrl}${PLATFORM_LOGO.logoSm || PLATFORM_LOGO.logo}`;
  const tenantUrl = buildTenantUrl(payload.slug, '/');
  const planName = getPlanName(payload.plan);
  const phoneDigits = payload.ownerPhone.replace(/\D/g, '');

  const detailRow = (label: string, valueHtml: string) => `
    <tr>
      <td style="padding:14px 0;border-bottom:1px solid #f3f4f6;vertical-align:top;width:38%;">
        <span style="font-size:12px;font-weight:600;letter-spacing:0.04em;text-transform:uppercase;color:#9ca3af;">${label}</span>
      </td>
      <td style="padding:14px 0 14px 12px;border-bottom:1px solid #f3f4f6;vertical-align:top;font-size:15px;line-height:1.5;color:#111827;font-weight:500;">
        ${valueHtml}
      </td>
    </tr>`;

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Nueva barbería — TuBarber</title>
</head>
<body style="margin:0;padding:0;background:#eceff3;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#eceff3;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:600px;">
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#0c0c0c 0%,#1a1a1a 100%);border-radius:16px 16px 0 0;padding:28px 32px 24px;border:1px solid #262626;border-bottom:none;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td>
                    <img src="${escapeAttr(logoUrl)}" alt="${escapeAttr(PLATFORM_LOGO_ALT)}" width="140" height="auto" style="display:block;border:0;max-width:140px;height:auto;" />
                  </td>
                  <td align="right" style="vertical-align:top;">
                    <span style="display:inline-block;padding:6px 12px;background:rgba(245,158,11,0.15);border:1px solid rgba(245,158,11,0.35);border-radius:999px;font-size:11px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;color:#fbbf24;">
                      Pendiente
                    </span>
                  </td>
                </tr>
              </table>
              <h1 style="margin:20px 0 0;font-size:24px;line-height:1.3;font-weight:700;color:#ffffff;letter-spacing:-0.02em;">
                Nueva barbería registrada
              </h1>
              <p style="margin:8px 0 0;font-size:15px;line-height:1.5;color:#a3a3a3;">
                <strong style="color:#f5f5f5;">${escapeHtml(payload.shopName)}</strong> solicita acceso a la plataforma.
              </p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="background:#ffffff;padding:8px 32px 28px;border-left:1px solid #e5e7eb;border-right:1px solid #e5e7eb;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-top:8px;">
                ${detailRow('Barbería', `<span style="font-size:17px;font-weight:700;color:#0c0c0c;">${escapeHtml(payload.shopName)}</span>`)}
                ${detailRow('Slug', `<code style="font-family:ui-monospace,Consolas,monospace;font-size:13px;background:#f9fafb;border:1px solid #e5e7eb;border-radius:6px;padding:4px 8px;color:#374151;">${escapeHtml(payload.slug)}</code>`)}
                ${detailRow('Plan', `<span style="display:inline-block;padding:4px 10px;background:#fffbeb;border:1px solid #fde68a;border-radius:6px;color:#92400e;font-size:13px;font-weight:600;">${escapeHtml(planName)}</span>`)}
                ${detailRow('Dueño', escapeHtml(payload.ownerName))}
                ${detailRow('Email', `<a href="mailto:${escapeAttr(payload.ownerEmail)}" style="color:#d97706;text-decoration:none;font-weight:600;">${escapeHtml(payload.ownerEmail)}</a>`)}
                ${detailRow('Teléfono', `<a href="tel:+${escapeAttr(phoneDigits)}" style="color:#d97706;text-decoration:none;font-weight:600;">${escapeHtml(payload.ownerPhone)}</a>`)}
                ${detailRow('Usuario admin', `<code style="font-family:ui-monospace,Consolas,monospace;font-size:13px;background:#f9fafb;border:1px solid #e5e7eb;border-radius:6px;padding:4px 8px;color:#374151;">${escapeHtml(payload.username)}</code>`)}
                ${detailRow('URL tenant', `<a href="${escapeAttr(tenantUrl)}" style="color:#d97706;text-decoration:none;word-break:break-all;">${escapeHtml(tenantUrl)}</a>`)}
              </table>

              <!-- CTA -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-top:28px;">
                <tr>
                  <td align="center">
                    <a href="${escapeAttr(tenantsUrl)}" style="display:inline-block;padding:14px 28px;background:linear-gradient(135deg,#f59e0b 0%,#d97706 100%);color:#ffffff;text-decoration:none;border-radius:10px;font-weight:700;font-size:15px;letter-spacing:0.01em;box-shadow:0 4px 14px rgba(217,119,6,0.35);">
                      Revisar solicitudes pendientes →
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#fafafa;border-radius:0 0 16px 16px;padding:20px 32px;border:1px solid #e5e7eb;border-top:none;text-align:center;">
              <p style="margin:0;font-size:12px;line-height:1.6;color:#9ca3af;">
                Notificación automática de <strong style="color:#6b7280;">TuBarber</strong><br />
                Panel de plataforma · <a href="${escapeAttr(tenantsUrl)}" style="color:#d97706;text-decoration:none;">${escapeHtml(tenantsUrl)}</a>
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
 * Notifies platform admins when a new tenant completes onboarding.
 * Returns false if email is not configured or sending fails; does not throw.
 */
export async function notifyNewTenantRegistration(
  payload: NewTenantNotificationPayload
): Promise<boolean> {
  const config = getResendConfig();
  if (!config) {
    console.warn(
      '[Resend] Skipping new-tenant notification: RESEND_API_KEY, RESEND_FROM or RESEND_TENANT_NOTIFY_TO not configured'
    );
    return false;
  }

  const resend = new Resend(config.apiKey);

  try {
    const { error } = await resend.emails.send({
      from: config.from,
      to: config.notifyTo,
      subject: `[TuBarber] Nueva barbería: ${payload.shopName}`,
      html: buildNewTenantEmailHtml(payload),
    });

    if (error) {
      console.error('[Resend] new-tenant notification failed:', error);
      return false;
    }

    return true;
  } catch (err) {
    console.error('[Resend] new-tenant notification error:', err);
    return false;
  }
}
