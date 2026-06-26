import Twilio from 'twilio';
import type { TwilioConfig } from './types';
import { toWhatsAppAddress } from './phone';

/** Build Twilio Content API variables: {"1":"val","2":"val",...} */
export function buildContentVariables(values: string[]): string {
  return JSON.stringify(
    Object.fromEntries(values.map((value, index) => [String(index + 1), value]))
  );
}

/**
 * Send a WhatsApp template message via Twilio Content API.
 * Template variables must use {{1}}, {{2}}, … in Twilio Console.
 */
export async function sendTwilioTemplateMessage(
  config: TwilioConfig,
  to: string,
  contentSid: string | undefined,
  variableValues: string[]
): Promise<boolean> {
  if (!contentSid) {
    console.warn('[Twilio] Content SID not configured');
    return false;
  }

  const client = Twilio(config.accountSid, config.authToken);

  try {
    const message = await client.messages.create({
      from: config.whatsappFrom,
      to: toWhatsAppAddress(to),
      contentSid,
      contentVariables: buildContentVariables(variableValues),
    });

    const ok = message.status !== 'failed' && message.status !== 'undelivered';
    if (!ok) {
      console.error(`[Twilio] Message ${message.sid} status: ${message.status}`);
    }
    return ok;
  } catch (err) {
    console.error('[Twilio] send failed:', err);
    return false;
  }
}
