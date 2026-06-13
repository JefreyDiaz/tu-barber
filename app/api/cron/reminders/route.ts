import { NextRequest, NextResponse } from 'next/server';
import { processBookingReminders } from '@/lib/reminders';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

function isAuthorized(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const auth = request.headers.get('authorization');
  return auth === `Bearer ${secret}`;
}

/**
 * Ejecutar recordatorios de cita (WhatsApp ~3h antes).
 * Disparado por un cron externo (p. ej. cron-job.org) cada ~15 min con
 * `Authorization: Bearer <CRON_SECRET>`.
 */
export async function GET(request: NextRequest) {
  if (!process.env.CRON_SECRET) {
    return NextResponse.json(
      { ok: false, error: 'CRON_SECRET no configurado' },
      { status: 503 }
    );
  }
  if (!isAuthorized(request)) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const result = await processBookingReminders();
    return NextResponse.json({ ok: true, ...result });
  } catch (e) {
    console.error('[cron/reminders]', e);
    return NextResponse.json({ ok: false, error: 'Internal error' }, { status: 500 });
  }
}
