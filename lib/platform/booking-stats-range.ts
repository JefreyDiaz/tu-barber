import { calendarDateKey, DEFAULT_TIMEZONE, formatDateForDisplay } from '@/lib/dates/timezone';

export type BookingStatsPreset =
  | 'this_month'
  | 'last_month'
  | 'today'
  | 'yesterday'
  | 'day'
  | 'range';

export type BookingStatsRange = {
  preset: BookingStatsPreset;
  fromKey: string;
  toKey: string;
  label: string;
};

const DATE_KEY_RE = /^\d{4}-\d{2}-\d{2}$/;

export function isValidDateKey(value: string): boolean {
  if (!DATE_KEY_RE.test(value)) return false;
  const [y, m, d] = value.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  return dt.getUTCFullYear() === y && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d;
}

export function addDaysToDateKey(dateKey: string, days: number): string {
  const [y, m, d] = dateKey.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + days));
  return `${dt.getUTCFullYear()}-${String(dt.getUTCMonth() + 1).padStart(2, '0')}-${String(dt.getUTCDate()).padStart(2, '0')}`;
}

function lastDayOfMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

export function startOfCalendarDayUtc(dateKey: string, timeZone: string): Date {
  const [y, m, d] = dateKey.split('-').map(Number);
  let lo = Date.UTC(y, m - 1, d - 1, 0, 0, 0);
  let hi = Date.UTC(y, m - 1, d + 1, 23, 59, 59, 999);

  while (lo < hi) {
    const mid = Math.floor((lo + hi) / 2);
    const key = calendarDateKey(new Date(mid), timeZone);
    if (key < dateKey) lo = mid + 1;
    else hi = mid;
  }

  return new Date(lo);
}

export function endOfCalendarDayUtc(dateKey: string, timeZone: string): Date {
  const nextKey = addDaysToDateKey(dateKey, 1);
  return new Date(startOfCalendarDayUtc(nextKey, timeZone).getTime() - 1);
}

export function calendarRangeToUtcBounds(
  fromKey: string,
  toKey: string,
  timeZone: string = DEFAULT_TIMEZONE
): { start: Date; end: Date } {
  return {
    start: startOfCalendarDayUtc(fromKey, timeZone),
    end: endOfCalendarDayUtc(toKey, timeZone),
  };
}

function formatDayLabel(dateKey: string, timeZone: string): string {
  const [y, m, d] = dateKey.split('-').map(Number);
  return formatDateForDisplay(new Date(Date.UTC(y, m - 1, d, 12, 0, 0)), timeZone);
}

function formatMonthLabel(year: number, month: number, timeZone: string): string {
  return new Intl.DateTimeFormat('es-CO', {
    timeZone,
    month: 'long',
    year: 'numeric',
  }).format(new Date(Date.UTC(year, month - 1, 15, 12, 0, 0)));
}

export function resolveBookingStatsRange(
  preset: BookingStatsPreset,
  timeZone: string = DEFAULT_TIMEZONE,
  now: Date = new Date(),
  options?: { date?: string; from?: string; to?: string }
): BookingStatsRange {
  const todayKey = calendarDateKey(now, timeZone);
  const [yearStr, monthStr] = todayKey.split('-');
  const year = Number(yearStr);
  const month = Number(monthStr);

  switch (preset) {
    case 'today':
      return { preset, fromKey: todayKey, toKey: todayKey, label: 'Hoy' };
    case 'yesterday': {
      const key = addDaysToDateKey(todayKey, -1);
      return { preset, fromKey: key, toKey: key, label: 'Ayer' };
    }
    case 'this_month': {
      const fromKey = `${yearStr}-${monthStr}-01`;
      const toKey = `${yearStr}-${monthStr}-${String(lastDayOfMonth(year, month)).padStart(2, '0')}`;
      return { preset, fromKey, toKey, label: formatMonthLabel(year, month, timeZone) };
    }
    case 'last_month': {
      const prev = new Date(Date.UTC(year, month - 2, 1));
      const py = prev.getUTCFullYear();
      const pm = prev.getUTCMonth() + 1;
      const fromKey = `${py}-${String(pm).padStart(2, '0')}-01`;
      const toKey = `${py}-${String(pm).padStart(2, '0')}-${String(lastDayOfMonth(py, pm)).padStart(2, '0')}`;
      return { preset, fromKey, toKey, label: formatMonthLabel(py, pm, timeZone) };
    }
    case 'day': {
      const date = options?.date?.trim();
      if (!date || !isValidDateKey(date)) {
        throw new Error('Fecha inválida');
      }
      return { preset, fromKey: date, toKey: date, label: formatDayLabel(date, timeZone) };
    }
    case 'range': {
      const from = options?.from?.trim();
      const to = options?.to?.trim();
      if (!from || !to || !isValidDateKey(from) || !isValidDateKey(to)) {
        throw new Error('Rango de fechas inválido');
      }
      if (from > to) {
        throw new Error('La fecha inicial no puede ser posterior a la final');
      }
      const label =
        from === to
          ? formatDayLabel(from, timeZone)
          : `${formatDayLabel(from, timeZone)} – ${formatDayLabel(to, timeZone)}`;
      return { preset, fromKey: from, toKey: to, label };
    }
    default:
      throw new Error('Periodo inválido');
  }
}
