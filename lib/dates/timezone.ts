const DEFAULT_TIMEZONE = 'America/Bogota';

/** YYYY-MM-DD in the given IANA timezone. */
export function calendarDateKey(date: Date, timeZone: string = DEFAULT_TIMEZONE): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone }).format(date);
}

/** Calendar date for the day after `now` in the given timezone. */
export function tomorrowDateKey(now: Date, timeZone: string = DEFAULT_TIMEZONE): string {
  const today = calendarDateKey(now, timeZone);
  const [year, month, day] = today.split('-').map(Number);
  const next = new Date(Date.UTC(year, month - 1, day + 1));
  return calendarDateKey(next, timeZone);
}

export function isPeriodEndingTomorrow(
  periodEnd: Date,
  now: Date = new Date(),
  timeZone: string = DEFAULT_TIMEZONE
): boolean {
  return calendarDateKey(periodEnd, timeZone) === tomorrowDateKey(now, timeZone);
}

export function formatDateForDisplay(
  date: Date,
  timeZone: string = DEFAULT_TIMEZONE
): string {
  return new Intl.DateTimeFormat('es-CO', {
    timeZone,
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date);
}

export function addMonths(from: Date, months: number): Date {
  const end = new Date(from);
  end.setMonth(end.getMonth() + months);
  return end;
}

export { DEFAULT_TIMEZONE };
