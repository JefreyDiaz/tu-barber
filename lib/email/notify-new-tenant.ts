import { Resend } from 'resend';
import { getPlanName } from '@/lib/plans';
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

function buildNewTenantEmailHtml(payload: NewTenantNotificationPayload): string {
  const platformUrl = getPlatformAppUrl();
  const tenantsUrl = `${platformUrl}/platform/tenants`;
  const tenantUrl =
    process.env.NEXT_PUBLIC_ROOT_DOMAIN && !process.env.NEXT_PUBLIC_ROOT_DOMAIN.includes('localhost')
      ? `https://${payload.slug}.${process.env.NEXT_PUBLIC_ROOT_DOMAIN}`
      : `${platformUrl}?tenant=${payload.slug}`;
  const planName = getPlanName(payload.plan);

  const row = (label: string, value: string) =>
    `<tr><td style="padding:8px 12px;color:#6b7280;font-size:14px;white-space:nowrap;">${label}</td>` +
    `<td style="padding:8px 12px;color:#111827;font-size:14px;">${escapeHtml(value)}</td></tr>`;

  return `<!DOCTYPE html>
<html lang="es">
<body style="margin:0;padding:24px;background:#f3f4f6;font-family:system-ui,-apple-system,sans-serif;">
  <div style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e5e7eb;">
    <div style="padding:24px;background:#0c0c0c;color:#ffffff;">
      <h1 style="margin:0;font-size:20px;font-weight:600;">Nueva barbería registrada</h1>
      <p style="margin:8px 0 0;font-size:14px;color:#d1d5db;">Revisa y aprueba el tenant en el panel de plataforma.</p>
    </div>
    <div style="padding:24px;">
      <table style="width:100%;border-collapse:collapse;">
        ${row('Barbería', payload.shopName)}
        ${row('Slug', payload.slug)}
        ${row('Plan', planName)}
        ${row('Dueño', payload.ownerName)}
        ${row('Email', payload.ownerEmail)}
        ${row('Teléfono', payload.ownerPhone)}
        ${row('Usuario admin', payload.username)}
        ${row('URL tenant', tenantUrl)}
      </table>
      <p style="margin:24px 0 0;">
        <a href="${escapeHtml(tenantsUrl)}" style="display:inline-block;padding:12px 20px;background:#d97706;color:#ffffff;text-decoration:none;border-radius:8px;font-weight:600;font-size:14px;">
          Ver solicitudes pendientes
        </a>
      </p>
    </div>
  </div>
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
    console.warn('[Resend] Skipping new-tenant notification: RESEND_API_KEY, RESEND_FROM or RESEND_TENANT_NOTIFY_TO not configured');
    return false;
  }

  const resend = new Resend(config.apiKey);

  try {
    const { data, error } = await resend.emails.send({
      from: config.from,
      to: config.notifyTo,
      subject: `[TuBarber] Nueva barbería: ${payload.shopName}`,
      html: buildNewTenantEmailHtml(payload),
    });

    if (error) {
      console.error('[Resend] new-tenant notification failed:', error);
      return false;
    }

    console.log(`[Resend] new-tenant notification sent (${data?.id}) → ${config.notifyTo.join(', ')}`);
    return true;
  } catch (err) {
    console.error('[Resend] new-tenant notification error:', err);
    return false;
  }
}
