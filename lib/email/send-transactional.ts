import { randomUUID } from 'node:crypto';
import { Resend } from 'resend';
import { getResendReplyTo, getResendSendConfig } from './get-config';

export type TransactionalEmailOptions = {
  to: string;
  subject: string;
  html: string;
  text: string;
  /** Credential / auth emails — omit marketing-style headers. */
  sensitive?: boolean;
};

/** Sends a multipart (HTML + plain text) transactional email via Resend. */
export async function sendTransactionalEmail(options: TransactionalEmailOptions): Promise<boolean> {
  const config = getResendSendConfig();
  if (!config) return false;

  const resend = new Resend(config.apiKey);
  const replyTo = getResendReplyTo();

  try {
    const { error } = await resend.emails.send({
      from: config.from,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
      ...(replyTo ? { replyTo } : {}),
      ...(options.sensitive
        ? {
            headers: {
              'X-Entity-Ref-ID': randomUUID(),
            },
          }
        : {}),
    });

    if (error) {
      console.error('[Resend] transactional email failed:', error);
      return false;
    }

    return true;
  } catch (err) {
    console.error('[Resend] transactional email error:', err);
    return false;
  }
}
