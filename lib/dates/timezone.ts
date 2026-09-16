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

/** YYYY-MM in the given IANA timezone. */
export function monthPeriodKey(date: Date, timeZone: string = DEFAULT_TIMEZONE): string {
  return calendarDateKey(date, timeZone).slice(0, 7);
}

/** Day of month (1–31) in the given IANA timezone. */
export function localDayOfMonth(date: Date, timeZone: string = DEFAULT_TIMEZONE): number {
  return Number(calendarDateKey(date, timeZone).split('-')[2]);
}

export function isLocalDayOfMonth(
  date: Date,
  timeZone: string,
  day: number
): boolean {
  return localDayOfMonth(date, timeZone) === day;
}

/** True when local calendar day and hour match (24h clock). */
export function isLocalDayAndHour(
  now: Date,
  timeZone: string,
  day: number,
  hour: number
): boolean {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    day: 'numeric',
    hour: 'numeric',
    hour12: false,
  }).formatToParts(now);

  const localDay = Number(parts.find((part) => part.type === 'day')?.value);
  let localHour = Number(parts.find((part) => part.type === 'hour')?.value);
  if (localHour === 24) localHour = 0;

  return localDay === day && localHour === hour;
}

export { DEFAULT_TIMEZONE };
