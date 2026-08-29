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

  const toAddress = toWhatsAppAddress(to);

  try {
    const message = await client.messages.create({
      from: config.whatsappFrom,
      to: toAddress,
      contentSid,
      contentVariables: buildContentVariables(variableValues),
    });

    const ok = message.status !== 'failed' && message.status !== 'undelivered';
    if (ok) {
      console.info(
        `[Twilio] Message queued sid=${message.sid} status=${message.status} to=${toAddress} template=${contentSid}`
      );
    } else {
      console.error(
        `[Twilio] Message rejected sid=${message.sid} status=${message.status} error=${message.errorCode ?? 'none'} to=${toAddress}`
      );
    }
    return ok;
  } catch (err) {
    const detail =
      err && typeof err === 'object' && 'code' in err
        ? ` code=${String((err as { code?: unknown }).code)} message=${String((err as { message?: unknown }).message ?? err)}`
        : ` ${String(err)}`;
    console.error(`[Twilio] send failed to=${toAddress} template=${contentSid}${detail}`);
    return false;
  }
}
