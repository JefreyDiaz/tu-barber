import { formatMinutesToAmPm, getScheduleForDayFromConfig, type ScheduleConfig, type TimeBlock } from '@/lib/schedule';

const DAY_SHORT = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'] as const;

export type ScheduleSummaryLine = {
  kind: 'open' | 'closed' | 'meal' | 'interval';
  label: string;
  detail: string;
  color: 'blue' | 'red' | 'emerald' | 'amber' | 'gray';
};

function blocksSignature(blocks: TimeBlock[]): string {
  return [...blocks]
    .sort((a, b) => a.start - b.start)
    .map((b) => `${b.start}-${b.end}`)
    .join('|');
}

function formatDayList(days: number[]): string {
  const order = [1, 2, 3, 4, 5, 6, 0];
  const sorted = [...days].sort((a, b) => order.indexOf(a) - order.indexOf(b));
  return sorted.map((d) => DAY_SHORT[d]).join(', ');
}

function formatBlocks(blocks: TimeBlock[]): string {
  return [...blocks]
    .sort((a, b) => a.start - b.start)
    .map((b) => `${formatMinutesToAmPm(b.start)}-${formatMinutesToAmPm(b.end)}`)
    .join(' | ');
}

function gapsBetweenBlocks(blocks: TimeBlock[]): TimeBlock[] {
  const sorted = [...blocks].sort((a, b) => a.start - b.start);
  const gaps: TimeBlock[] = [];
  for (let i = 0; i < sorted.length - 1; i++) {
    if (sorted[i + 1].start > sorted[i].end) {
      gaps.push({ start: sorted[i].end, end: sorted[i + 1].start });
    }
  }
  return gaps;
}

function gapsSignature(gaps: TimeBlock[]): string {
  return gaps.map((g) => `${g.start}-${g.end}`).join('|');
}

const OPEN_COLORS: ScheduleSummaryLine['color'][] = ['blue', 'emerald'];

/** Human-readable summary of tenant schedule for admin horarios panel. */
export function buildScheduleSummary(
  scheduleJson: ScheduleConfig | null,
  slotStepMinutes: number
): ScheduleSummaryLine[] {
  const lines: ScheduleSummaryLine[] = [];

  const openGroups = new Map<string, number[]>();
  const closedDays: number[] = [];

  for (let day = 0; day <= 6; day++) {
    const blocks = getScheduleForDayFromConfig(day, scheduleJson);
    if (!blocks || blocks.length === 0) {
      closedDays.push(day);
      continue;
    }
    const sig = blocksSignature(blocks);
    const group = openGroups.get(sig) ?? [];
    group.push(day);
    openGroups.set(sig, group);
  }

  let openColorIndex = 0;
  const openEntries = [...openGroups.entries()].sort(
    ([, daysA], [, daysB]) => {
      const order = [1, 2, 3, 4, 5, 6, 0];
      const minA = Math.min(...daysA.map((d) => order.indexOf(d)));
      const minB = Math.min(...daysB.map((d) => order.indexOf(d)));
      return minA - minB;
    }
  );
  for (const [, days] of openEntries) {
    const blocks = getScheduleForDayFromConfig(days[0], scheduleJson)!;
    lines.push({
      kind: 'open',
      label: formatDayList(days),
      detail: formatBlocks(blocks),
      color: OPEN_COLORS[openColorIndex % OPEN_COLORS.length] ?? 'blue',
    });
    openColorIndex += 1;
  }

  if (closedDays.length > 0) {
    lines.push({
      kind: 'closed',
      label: formatDayList(closedDays),
      detail: 'No trabaja',
      color: 'red',
    });
  }

  const mealGroups = new Map<string, number[]>();
  for (let day = 0; day <= 6; day++) {
    const blocks = getScheduleForDayFromConfig(day, scheduleJson);
    if (!blocks || blocks.length < 2) continue;
    const gaps = gapsBetweenBlocks(blocks);
    if (gaps.length === 0) continue;
    const sig = gapsSignature(gaps);
    const group = mealGroups.get(sig) ?? [];
    group.push(day);
    mealGroups.set(sig, group);
  }

  for (const [, days] of mealGroups) {
    const blocks = getScheduleForDayFromConfig(days[0], scheduleJson)!;
    const gaps = gapsBetweenBlocks(blocks);
    const gapText = gaps
      .map((g) => `${formatMinutesToAmPm(g.start)}-${formatMinutesToAmPm(g.end)}`)
      .join(' | ');
    lines.push({
      kind: 'meal',
      label: 'Comida',
      detail: `${gapText} (${formatDayList(days)})`,
      color: 'amber',
    });
  }

  lines.push({
    kind: 'interval',
    label: 'Intervalo de turnos',
    detail: `cada ${slotStepMinutes} min (según tu servicio más corto)`,
    color: 'gray',
  });

  return lines;
}

const COLOR_CLASS: Record<ScheduleSummaryLine['color'], string> = {
  blue: 'bg-blue-500',
  red: 'bg-red-400',
  emerald: 'bg-emerald-500',
  amber: 'bg-amber-400',
  gray: 'bg-white/30',
};

export function scheduleSummaryDotClass(color: ScheduleSummaryLine['color']): string {
  return COLOR_CLASS[color];
}
