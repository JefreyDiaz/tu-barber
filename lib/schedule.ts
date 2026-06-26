import { colombiaToUTC, getColombiaComponents } from './date-utils';
import { DEFAULT_SCHEDULE } from './tenant/defaults';
import { fitsInSchedule } from './slot-availability';

export type TimeBlock = { start: number; end: number };

export const SLOT_DURATION_MINUTES = 40;

export type ScheduleConfig = Record<string, TimeBlock[] | null>;

/** Get schedule blocks for a day from tenant config or defaults */
export function getScheduleForDayFromConfig(
  dayOfWeek: number,
  scheduleJson?: ScheduleConfig | null
): TimeBlock[] | null {
  const config = scheduleJson ?? DEFAULT_SCHEDULE;
  const key = String(dayOfWeek);
  if (key in config) return config[key];
  return getScheduleForDay(dayOfWeek);
}

/**
 * Configuración de horarios de la barbería (default — used when no tenant config)
 *
 * Lunes, Martes, Jueves y Viernes: 7:40 AM - 11:40 AM | 2:00 PM - 7:30 PM | 8:00 PM - 10:00 PM
 * Miércoles: No trabaja
 * Sábado:   7:00 AM - 1:00 PM  | 1:40 PM - 10:00 PM
 * Domingo:  7:00 AM - 1:00 PM  | 1:40 PM - 10:00 PM
 */

/**
 * Convierte minutos desde medianoche a formato AM/PM
 * Ejemplo: 480 → "8:00 AM", 520 → "8:40 AM", 840 → "2:00 PM"
 */
export function formatMinutesToAmPm(totalMinutes: number): string {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHour = hours % 12 || 12;
  return `${displayHour}:${String(minutes).padStart(2, '0')} ${period}`;
}

/**
 * Convierte hora de formato 24h a AM/PM (retrocompatibilidad)
 */
export function formatHourToAmPm(hour: number): string {
  return formatMinutesToAmPm(hour * 60);
}

/**
 * Parsea hora en formato AM/PM a minutos desde medianoche
 * Ejemplo: "8:00 AM" → 480, "8:40 AM" → 520, "2:00 PM" → 840
 */
export function parseAmPmToMinutes(timeStr: string): number {
  const regex = /^(\d{1,2}):(\d{2})\s*(AM|PM)$/i;
  const match = regex.exec(timeStr);
  if (!match) {
    // Fallback: intentar parsear como formato 24h
    const parts = timeStr.split(':').map(Number);
    return parts[0] * 60 + (parts[1] || 0);
  }

  let hour = Number.parseInt(match[1], 10);
  const minutes = Number.parseInt(match[2], 10);
  const period = match[3].toUpperCase();

  if (period === 'PM' && hour !== 12) {
    hour += 12;
  } else if (period === 'AM' && hour === 12) {
    hour = 0;
  }

  return hour * 60 + minutes;
}

/**
 * Parsea hora en formato AM/PM a hora en formato 24h (retrocompatibilidad)
 * Ejemplo: "2:00 PM" -> 14, "8:00 AM" -> 8
 */
export function parseAmPmToHour(timeStr: string): number {
  return Math.floor(parseAmPmToMinutes(timeStr) / 60);
}

/**
 * Obtiene la configuración de horario para un día de la semana
 * Retorna un array de bloques de tiempo (start/end en minutos desde medianoche),
 * o null si no trabaja ese día.
 *
 * dayOfWeek: 0 = Domingo, 1 = Lunes, ..., 6 = Sábado
 */
export function getScheduleForDay(dayOfWeek: number): TimeBlock[] | null {
  switch (dayOfWeek) {
    case 1: // Lunes
    case 2: // Martes
    case 4: // Jueves
    case 5: // Viernes
      return [
        { start: 7 * 60 + 40, end: 11 * 60 + 40 },  // 7:40 AM - 11:40 AM
        { start: 14 * 60, end: 19 * 60 + 30 },      // 2:00 PM - 7:30 PM
        { start: 20 * 60, end: 22 * 60 },            // 8:00 PM - 10:00 PM
      ];
    case 3: // Miércoles - No trabaja
      return null;
    case 6: // Sábado
    case 0: // Domingo
      return [
        { start: 7 * 60, end: 13 * 60 },            // 7:00 AM - 1:00 PM
        { start: 13 * 60 + 40, end: 22 * 60 },      // 1:40 PM - 10:00 PM
      ];
    default:
      return null;
  }
}

/**
 * Genera horarios candidatos cada `stepMinutes` dentro de los bloques del día.
 * Por defecto el paso coincide con la duración mínima a cubrir (servicio más corto).
 */
export function getAvailableTimeSlots(
  date: Date,
  scheduleJson?: ScheduleConfig | null,
  stepMinutes = 30,
  minDurationMinutes = stepMinutes
): string[] {
  const dayOfWeek = date.getDay();
  const blocks = getScheduleForDayFromConfig(dayOfWeek, scheduleJson);
  if (!blocks) return [];

  const slots: string[] = [];
  for (const block of blocks) {
    for (let m = block.start; m + minDurationMinutes <= block.end; m += stepMinutes) {
      slots.push(formatMinutesToAmPm(m));
    }
  }
  return slots;
}

/**
 * Verifica si fecha/hora + duración caben en el horario del tenant
 */
export function isValidBookingDateTime(
  dateTime: Date,
  scheduleJson?: ScheduleConfig | null,
  durationMinutes = SLOT_DURATION_MINUTES
): boolean {
  const now = new Date();
  const minAdvance = new Date(now.getTime() + 60 * 60 * 1000);

  if (dateTime < minAdvance) return false;

  const { year, month, day, hours, minutes } = getColombiaComponents(dateTime);
  const localDate = new Date(year, month, day);
  const totalMinutes = hours * 60 + minutes;
  return fitsInSchedule(totalMinutes, durationMinutes, localDate, scheduleJson);
}

/**
 * Combina fecha y hora en un objeto Date (UTC) interpretando la hora como Colombia (UTC-5).
 * Acepta formato AM/PM (ej: "2:00 PM", "8:40 AM") o 24h (ej: "14:00")
 */
export function combineDateAndTime(date: Date, time: string): Date {
  const totalMinutes = parseAmPmToMinutes(time);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  const year = date.getFullYear();
  const month = date.getMonth();
  const day = date.getDate();
  return colombiaToUTC(year, month, day, hours, minutes);
}
