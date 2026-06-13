/**
 * Utilidades de fecha/hora para zona horaria de Colombia (America/Bogota).
 * Colombia es UTC-5 sin horario de verano (DST).
 */

export const COLOMBIA_TZ = 'America/Bogota';
const COLOMBIA_OFFSET_HOURS = -5;

/**
 * Extrae componentes de fecha/hora en zona Colombia desde un Date UTC.
 */
export function getColombiaComponents(date: Date) {
  const colombiaMs = date.getTime() + COLOMBIA_OFFSET_HOURS * 60 * 60 * 1000;
  const col = new Date(colombiaMs);
  return {
    year: col.getUTCFullYear(),
    month: col.getUTCMonth(),
    day: col.getUTCDate(),
    dayOfWeek: col.getUTCDay(),
    hours: col.getUTCHours(),
    minutes: col.getUTCMinutes(),
  };
}

/**
 * Crea un Date UTC a partir de fecha calendario y hora en zona Colombia.
 * Ejemplo: colombiaToUTC(2026, 1, 20, 21, 20) → 2026-02-21T02:20:00.000Z
 */
export function colombiaToUTC(
  year: number,
  month: number,
  day: number,
  hours: number,
  minutes: number,
): Date {
  return new Date(Date.UTC(year, month, day, hours - COLOMBIA_OFFSET_HOURS, minutes, 0, 0));
}

/**
 * Formatea un Date a fecha legible en español con zona Colombia.
 */
export function formatColombiaDate(date: Date): string {
  return date.toLocaleDateString('es-CO', {
    timeZone: COLOMBIA_TZ,
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

/**
 * Formatea un Date a hora AM/PM en zona Colombia.
 */
export function formatColombiaTime(date: Date): string {
  const { hours, minutes } = getColombiaComponents(date);
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHour = hours % 12 || 12;
  return `${displayHour}:${String(minutes).padStart(2, '0')} ${period}`;
}

/**
 * Retorna YYYY-MM-DD en zona Colombia para un Date UTC.
 */
export function toColombiaDateString(date: Date): string {
  const { year, month, day } = getColombiaComponents(date);
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

/**
 * Retorna inicio y fin del día en Colombia como timestamps UTC.
 * Útil para queries de base de datos.
 */
export function getColombiaDayRange(year: number, month: number, day: number) {
  const startOfDay = colombiaToUTC(year, month - 1, day, 0, 0);
  const endOfDay = new Date(colombiaToUTC(year, month - 1, day + 1, 0, 0).getTime() - 1);
  return { startOfDay, endOfDay };
}
