import { PLATFORM_LOGO, PLATFORM_LOGO_ALT } from '@/lib/brand';
import { buildTenantUrl, formatTenantHost } from '@/lib/tenant/urls';
import { getPlatformAppUrl, getResendSendConfig } from './get-config';
import { sendTransactionalEmail } from './send-transactional';

export type PasswordResetEmailKind = 'reset' | 'welcome';

export interface PasswordResetEmailPayload {
  shopName: string;
  slug: string;
  ownerName: string;
  toEmail: string;
  username: string;
  temporaryPassword: string;
  kind?: PasswordResetEmailKind;
}

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

function buildCopy(payload: PasswordResetEmailPayload) {
  const kind = payload.kind ?? 'reset';
  if (kind === 'welcome') {
    return {
      subject: `TuBarber — Bienvenido al equipo (${payload.shopName})`,
      title: 'Bienvenido al equipo',
      intro: `Hola ${payload.ownerName}, te registraron en ${payload.shopName}.`,
      body: 'Usa estos datos para ingresar al panel. Al entrar por primera vez, el sistema te pedirá crear una contraseña nueva.',
      footerNote: 'Si no esperabas este correo, contacta al administrador de tu barbería.',
      passwordLabel: 'Contraseña inicial',
    };
  }

  return {
    subject: `TuBarber — Datos de acceso (${payload.shopName})`,
    title: 'Datos de acceso al panel',
    intro: `Hola ${payload.ownerName}, restablecimos el acceso a ${payload.shopName}.`,
    body: 'Usa estos datos para ingresar al panel. Al entrar, el sistema te pedirá crear una contraseña nueva.',
    footerNote: 'Si no solicitaste este cambio, contacta al administrador de tu barbería de inmediato.',
    passwordLabel: 'Contraseña temporal',
  };
}

function buildPasswordResetHtml(payload: PasswordResetEmailPayload): string {
  const platformUrl = getPlatformAppUrl();
  const logoUrl = `${platformUrl}${PLATFORM_LOGO.logoSm || PLATFORM_LOGO.logo}`;
  const loginUrl = buildTenantUrl(payload.slug, '/login');
  const tenantHost = formatTenantHost(payload.slug);
  const copy = buildCopy(payload);

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(copy.title)} — TuBarber</title>
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
                ${escapeHtml(copy.title)}
              </h1>
              <p style="margin:8px 0 0;font-size:15px;line-height:1.5;color:#a3a3a3;">
                ${escapeHtml(copy.intro)}
              </p>
            </td>
          </tr>
          <tr>
            <td style="background:#ffffff;padding:28px 32px;border-left:1px solid #e5e7eb;border-right:1px solid #e5e7eb;">
              <p style="margin:0 0 16px;font-size:15px;line-height:1.65;color:#374151;">
                ${escapeHtml(copy.body)}
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
                      <strong>${escapeHtml(copy.passwordLabel)}:</strong>
                      <code style="font-family:ui-monospace,Consolas,monospace;font-size:13px;background:#fff;border:1px solid #e5e7eb;border-radius:6px;padding:2px 8px;color:#374151;">${escapeHtml(payload.temporaryPassword)}</code>
                    </p>
                    <p style="margin:0;font-size:14px;line-height:1.5;color:#6b7280;">
                      Sitio: <a href="${escapeAttr(loginUrl)}" style="color:#d97706;text-decoration:none;">${escapeHtml(tenantHost)}</a>
                    </p>
                  </td>
                </tr>
              </table>
              <p style="margin:16px 0 0;font-size:13px;line-height:1.6;color:#9ca3af;">
                ${escapeHtml(copy.footerNote)}
              </p>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-top:24px;">
                <tr>
                  <td align="center">
                    <a href="${escapeAttr(loginUrl)}" style="display:inline-block;padding:14px 28px;background:linear-gradient(135deg,#f59e0b 0%,#d97706 100%);color:#ffffff;text-decoration:none;border-radius:10px;font-weight:700;font-size:15px;letter-spacing:0.01em;">
                      Iniciar sesión
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

function buildPasswordResetText(payload: PasswordResetEmailPayload): string {
  const loginUrl = buildTenantUrl(payload.slug, '/login');
  const tenantHost = formatTenantHost(payload.slug);
  const platformUrl = getPlatformAppUrl();
  const copy = buildCopy(payload);

  return [
    copy.title,
    '',
    copy.intro,
    '',
    copy.body,
    '',
    'Datos de acceso',
    `Usuario: ${payload.username}`,
    `${copy.passwordLabel}: ${payload.temporaryPassword}`,
    `Sitio: ${tenantHost}`,
    `Iniciar sesión: ${loginUrl}`,
    '',
    copy.footerNote,
    '',
    'Equipo TuBarber',
    platformUrl,
  ].join('\n');
}

/** Sends temporary password to tenant staff. Returns false if email not configured. */
export async function sendPasswordResetEmail(payload: PasswordResetEmailPayload): Promise<boolean> {
  if (!getResendSendConfig()) {
    console.warn('[Resend] Skipping password reset: RESEND_API_KEY or RESEND_FROM not configured');
    return false;
  }

  const copy = buildCopy(payload);

  return sendTransactionalEmail({
    to: payload.toEmail,
    subject: copy.subject,
    html: buildPasswordResetHtml(payload),
    text: buildPasswordResetText(payload),
    sensitive: true,
  });
}
