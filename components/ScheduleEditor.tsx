'use client';

import {
  formatMinutesToAmPm,
  minutesToTimeInputValue,
  timeInputValueToMinutes,
  type ScheduleConfig,
} from '@/lib/schedule';
import type { TimeBlock } from '@/lib/tenant/defaults';

const DAY_LABELS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

interface ScheduleEditorProps {
  value: ScheduleConfig;
  onChange: (value: ScheduleConfig) => void;
}

function emptyBlock(): TimeBlock {
  return { start: 8 * 60, end: 12 * 60 };
}

function ScheduleTimeField({
  label,
  minutes,
  onChange,
}: {
  label: string;
  minutes: number;
  onChange: (minutes: number) => void;
}) {
  function openPicker(input: HTMLInputElement) {
    if (typeof input.showPicker === 'function') {
      try {
        input.showPicker();
      } catch {
        // Ignorar si el navegador bloquea showPicker fuera de un gesto del usuario
      }
    }
  }

  return (
    <div className="flex flex-col gap-0.5">
      <input
        type="time"
        step={60}
        value={minutesToTimeInputValue(minutes)}
        onChange={(e) => {
          const parsed = timeInputValueToMinutes(e.target.value);
          if (parsed !== null) onChange(parsed);
        }}
        onClick={(e) => openPicker(e.currentTarget)}
        aria-label={label}
        className="schedule-time-input glass-input min-w-[8.5rem] cursor-pointer px-2 py-1.5 text-sm"
      />
      <span className="text-[10px] text-white/35">{formatMinutesToAmPm(minutes)}</span>
    </div>
  );
}

export default function ScheduleEditor({ value, onChange }: ScheduleEditorProps) {
  function setDayClosed(day: string, closed: boolean) {
    onChange({ ...value, [day]: closed ? null : [emptyBlock()] });
  }

  function updateBlockMinutes(
    day: string,
    index: number,
    field: 'start' | 'end',
    minutes: number
  ) {
    const blocks = [...(value[day] ?? [])];
    blocks[index] = { ...blocks[index], [field]: minutes };
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
    <div className="space-y-3">
      {DAY_LABELS.map((label, dayIndex) => {
        const day = String(dayIndex);
        const closed = value[day] === null;
        const blocks = value[day] ?? [];

        return (
          <div key={day} className="glass-card rounded-xl p-4">
            <div className="flex items-center justify-between gap-4">
              <span className="font-medium text-white/90">{label}</span>
              <label className="flex items-center gap-2 text-sm text-white/55">
                <input
                  type="checkbox"
                  checked={closed}
                  onChange={(e) => setDayClosed(day, e.target.checked)}
                  className="rounded border-white/20"
                />
                Cerrado
              </label>
            </div>

            {!closed && (
              <div className="mt-3 space-y-3">
                {blocks.map((block, i) => (
                  <div key={i} className="flex flex-wrap items-end gap-2">
                    <ScheduleTimeField
                      label={`${label} bloque ${i + 1} inicio`}
                      minutes={block.start}
                      onChange={(mins) => updateBlockMinutes(day, i, 'start', mins)}
                    />
                    <span className="pb-5 text-white/35">—</span>
                    <ScheduleTimeField
                      label={`${label} bloque ${i + 1} fin`}
                      minutes={block.end}
                      onChange={(mins) => updateBlockMinutes(day, i, 'end', mins)}
                    />
                    <button
                      type="button"
                      onClick={() => removeBlock(day, i)}
                      className="pb-5 text-xs text-red-300 hover:text-red-200"
                    >
                      Quitar
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => addBlock(day)}
                  className="text-sm text-amber-400/90 hover:text-amber-300"
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

export type { ScheduleConfig };
