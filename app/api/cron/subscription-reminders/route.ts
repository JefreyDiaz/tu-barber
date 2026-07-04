import { processSubscriptionRenewalReminders } from '@/lib/subscription-renewals';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

function isAuthorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const auth = request.headers.get('authorization');
  return auth === `Bearer ${secret}`;
}

export async function GET(request: Request) {
  if (!process.env.CRON_SECRET) {
    return Response.json({ ok: false, error: 'CRON_SECRET no configurado' }, { status: 503 });
  }
  if (!isAuthorized(request)) {
    return Response.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const result = await processSubscriptionRenewalReminders();
    return Response.json({ ok: true, ...result });
  } catch (e) {
    console.error('[cron/subscription-reminders]', e);
    return Response.json({ ok: false, error: 'Internal error' }, { status: 500 });
  }
}
