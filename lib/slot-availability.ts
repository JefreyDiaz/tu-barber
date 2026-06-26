import { getColombiaComponents } from './date-utils';
import {
  getScheduleForDayFromConfig,
  formatMinutesToAmPm,
  type ScheduleConfig,
} from './schedule';
import { DEFAULT_SLOT_STEP_MINUTES } from './slot-step';

export type TimeInterval = { start: number; end: number };

export function mergeIntervals(intervals: TimeInterval[]): TimeInterval[] {
  if (intervals.length === 0) return [];
  const sorted = [...intervals].sort((a, b) => a.start - b.start);
  const merged: TimeInterval[] = [{ ...sorted[0] }];

  for (let i = 1; i < sorted.length; i++) {
    const last = merged[merged.length - 1];
    const cur = sorted[i];
    if (cur.start <= last.end) {
      last.end = Math.max(last.end, cur.end);
    } else {
      merged.push({ ...cur });
    }
  }
  return merged;
}

export function getCandidateStartMinutes(
  date: Date,
  scheduleJson?: ScheduleConfig | null,
  stepMinutes = DEFAULT_SLOT_STEP_MINUTES
): number[] {
  const blocks = getScheduleForDayFromConfig(date.getDay(), scheduleJson);
  if (!blocks) return [];

  const starts: number[] = [];
  for (const block of blocks) {
    for (let m = block.start; m < block.end; m += stepMinutes) {
      starts.push(m);
    }
  }
  return starts;
}

export function fitsInSchedule(
  startMinutes: number,
  durationMinutes: number,
  date: Date,
  scheduleJson?: ScheduleConfig | null
): boolean {
  const blocks = getScheduleForDayFromConfig(date.getDay(), scheduleJson);
  if (!blocks) return false;
  const end = startMinutes + durationMinutes;
  return blocks.some((b) => startMinutes >= b.start && end <= b.end);
}

export function bookingToInterval(dateTime: Date, durationMinutes: number): TimeInterval {
  const { hours, minutes } = getColombiaComponents(dateTime);
  const start = hours * 60 + minutes;
  return { start, end: start + durationMinutes };
}

export function getAvailableSlotsForDuration(
  date: Date,
  durationMinutes: number,
  scheduleJson: ScheduleConfig | null | undefined,
  occupiedIntervals: TimeInterval[],
  blockedStartTimes: Set<string>,
  stepMinutes = DEFAULT_SLOT_STEP_MINUTES
): string[] {
  const mergedOccupied = mergeIntervals(occupiedIntervals);
  const candidates = getCandidateStartMinutes(date, scheduleJson, stepMinutes);

  const slots: string[] = [];
  for (const start of candidates) {
    const end = start + durationMinutes;
    if (!fitsInSchedule(start, durationMinutes, date, scheduleJson)) continue;

    const slotLabel = formatMinutesToAmPm(start);
    if (blockedStartTimes.has(slotLabel)) continue;

    const overlaps = mergedOccupied.some((occ) => start < occ.end && end > occ.start);
    if (!overlaps) slots.push(slotLabel);
  }
  return slots;
}
