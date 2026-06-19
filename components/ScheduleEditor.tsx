'use client';

import { formatMinutesToAmPm, parseAmPmToMinutes } from '@/lib/schedule';
import type { TimeBlock } from '@/lib/tenant/defaults';

const DAY_LABELS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

export type ScheduleConfig = Record<string, TimeBlock[] | null>;

interface ScheduleEditorProps {
  value: ScheduleConfig;
  onChange: (value: ScheduleConfig) => void;
}

function emptyBlock(): TimeBlock {
  return { start: 8 * 60, end: 12 * 60 };
}

export default function ScheduleEditor({ value, onChange }: ScheduleEditorProps) {
  function setDayClosed(day: string, closed: boolean) {
    onChange({ ...value, [day]: closed ? null : [emptyBlock()] });
  }

  function updateBlock(day: string, index: number, field: 'start' | 'end', timeStr: string) {
    const blocks = [...(value[day] ?? [])];
    blocks[index] = { ...blocks[index], [field]: parseAmPmToMinutes(timeStr) };
    onChange({ ...value, [day]: blocks });
  }

  function addBlock(day: string) {
    const blocks = [...(value[day] ?? []), emptyBlock()];
    onChange({ ...value, [day]: blocks });
  }

  function removeBlock(day: string, index: number) {
    const blocks = (value[day] ?? []).filter((_, i) => i !== index);
    onChange({ ...value, [day]: blocks.length ? blocks : null });
  }

  return (
    <div className="space-y-4">
      {DAY_LABELS.map((label, dayIndex) => {
        const day = String(dayIndex);
        const closed = value[day] === null;
        const blocks = value[day] ?? [];

        return (
          <div key={day} className="rounded-lg border border-neutral-200 p-4">
            <div className="flex items-center justify-between gap-4">
              <span className="font-medium text-neutral-800">{label}</span>
              <label className="flex items-center gap-2 text-sm text-neutral-600">
                <input
                  type="checkbox"
                  checked={closed}
                  onChange={(e) => setDayClosed(day, e.target.checked)}
                />
                Cerrado
              </label>
            </div>

            {!closed && (
              <div className="mt-3 space-y-2">
                {blocks.map((block, i) => (
                  <div key={i} className="flex flex-wrap items-center gap-2">
                    <input
                      type="text"
                      value={formatMinutesToAmPm(block.start)}
                      onChange={(e) => updateBlock(day, i, 'start', e.target.value)}
                      placeholder="8:00 AM"
                      className="w-28 rounded border border-neutral-300 px-2 py-1 text-sm"
                    />
                    <span className="text-neutral-400">—</span>
                    <input
                      type="text"
                      value={formatMinutesToAmPm(block.end)}
                      onChange={(e) => updateBlock(day, i, 'end', e.target.value)}
                      placeholder="12:00 PM"
                      className="w-28 rounded border border-neutral-300 px-2 py-1 text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => removeBlock(day, i)}
                      className="text-xs text-red-600 hover:underline"
                    >
                      Quitar
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => addBlock(day)}
                  className="text-sm text-neutral-600 hover:text-neutral-900"
                >
                  + Agregar bloque horario
                </button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
