export type TimeBlock = { start: number; end: number };

/** Default schedule matching lib/schedule.ts hardcoded values */
export const DEFAULT_SCHEDULE: Record<string, TimeBlock[] | null> = {
  '0': [
    { start: 420, end: 780 },
    { start: 820, end: 1320 },
  ],
  '1': [
    { start: 460, end: 700 },
    { start: 840, end: 1170 },
    { start: 1200, end: 1320 },
  ],
  '2': [
    { start: 460, end: 700 },
    { start: 840, end: 1170 },
    { start: 1200, end: 1320 },
  ],
  '3': null,
  '4': [
    { start: 460, end: 700 },
    { start: 840, end: 1170 },
    { start: 1200, end: 1320 },
  ],
  '5': [
    { start: 460, end: 700 },
    { start: 840, end: 1170 },
    { start: 1200, end: 1320 },
  ],
  '6': [
    { start: 420, end: 780 },
    { start: 820, end: 1320 },
  ],
};

export const DEFAULT_TENANT_SLUG = 'the-barber-house';

export type DefaultService = { name: string; durationMinutes: number; sortOrder: number };

export const DEFAULT_SERVICES: DefaultService[] = [
  { name: 'Corte completo', durationMinutes: 40, sortOrder: 0 },
  { name: 'Solo barba', durationMinutes: 20, sortOrder: 1 },
  { name: 'Solo corte', durationMinutes: 30, sortOrder: 2 },
];

/** Granularity for scanning start times (minutes) */
export const SLOT_STEP_MINUTES = 5;
