import type { BookingFieldData, ManyChatConfig } from './types';

const MANYCHAT_BASE = 'https://api.manychat.com';

interface ManyChatResponse {
  status: string;
  data?: Record<string, unknown>;
}

async function manyChatRequest(
  config: ManyChatConfig,
  path: string,
  body: Record<string, unknown>
): Promise<ManyChatResponse | null> {
  try {
    const res = await fetch(`${MANYCHAT_BASE}${path}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const json = (await res.json()) as ManyChatResponse;

    if (!res.ok) {
      console.error(`[ManyChat] ${path} failed:`, json);
      return null;
    }

    return json;
  } catch (err) {
    console.error(`[ManyChat] ${path} error:`, err);
    return null;
  }
}

/** Normalize phone to digits only for ManyChat WhatsApp */
function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, '');
}

/**
 * Find subscriber by WhatsApp phone custom field, or create if not found.
 * Returns subscriber_id or null.
 */
export async function findOrCreateSubscriber(
  config: ManyChatConfig,
  phone: string,
  name?: string
): Promise<number | null> {
  const normalizedPhone = normalizePhone(phone);
  const phoneFieldId = config.fieldMap.customerPhone;

  // Try find by custom field (WhatsApp phone)
  if (phoneFieldId) {
    const found = await manyChatRequest(config, '/fb/subscriber/findByCustomField', {
      field_id: Number(phoneFieldId),
      field_value: normalizedPhone,
    });

    const subscriberId = found?.data?.subscriber_id ?? found?.data?.id;
    if (subscriberId) {
      return Number(subscriberId);
    }
  }

  // Create new subscriber with WhatsApp phone
  const createBody: Record<string, unknown> = {
    whatsapp_phone: normalizedPhone,
  };
  if (name) {
    createBody.first_name = name;
  }

  const created = await manyChatRequest(config, '/fb/subscriber/createSubscriber', createBody);

  const newId = created?.data?.id ?? created?.data?.subscriber_id;
  if (newId) {
    return Number(newId);
  }

  // If create failed because subscriber exists, try findByName as fallback
  console.warn('[ManyChat] createSubscriber failed, subscriber may already exist');
  return null;
}

/** Set custom fields on a subscriber before sending a flow */
export async function setSubscriberFields(
  config: ManyChatConfig,
  subscriberId: number,
  data: BookingFieldData
): Promise<boolean> {
  const map = config.fieldMap;
  const fields: Array<{ field_id: number; field_value: string }> = [];

  const entries: Array<[keyof typeof map, string | undefined]> = [
    ['customerName', data.customerName],
    ['barberName', data.barberName],
    ['bookingDate', data.bookingDate],
    ['bookingTime', data.bookingTime],
    ['barberPhone', data.barberPhone],
    ['cancelUrl', data.cancelUrl],
    ['customerPhone', data.customerPhone],
  ];

  for (const [key, value] of entries) {
    const fieldId = map[key];
    if (fieldId && value) {
      fields.push({ field_id: Number(fieldId), field_value: value });
    }
  }

  if (fields.length === 0) {
    console.warn('[ManyChat] No custom field IDs configured in fieldMap');
    return true; // proceed anyway — flow may not need fields
  }

  const result = await manyChatRequest(config, '/fb/subscriber/setCustomFields', {
    subscriber_id: subscriberId,
    fields,
  });

  return result?.status === 'success';
}

/** Trigger a ManyChat flow for a subscriber */
export async function sendFlow(
  config: ManyChatConfig,
  subscriberId: number,
  flowNs: string
): Promise<boolean> {
  const result = await manyChatRequest(config, '/fb/sending/sendFlow', {
    subscriber_id: subscriberId,
    flow_ns: flowNs,
  });

  if (result?.status === 'success') {
    console.log(`[ManyChat] Flow ${flowNs} sent to subscriber ${subscriberId}`);
    return true;
  }

  return false;
}

/** Full message pipeline: find/create → set fields → send flow */
export async function sendManyChatMessage(
  config: ManyChatConfig,
  phone: string,
  flowNs: string | undefined,
  fieldData: BookingFieldData,
  subscriberName?: string
): Promise<boolean> {
  if (!flowNs) {
    console.warn('[ManyChat] Flow namespace not configured');
    return false;
  }

  const subscriberId = await findOrCreateSubscriber(config, phone, subscriberName);
  if (!subscriberId) {
    console.error('[ManyChat] Could not find or create subscriber for', phone);
    return false;
  }

  await setSubscriberFields(config, subscriberId, fieldData);
  return sendFlow(config, subscriberId, flowNs);
}
