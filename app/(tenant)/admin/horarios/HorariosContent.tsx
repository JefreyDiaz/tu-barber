'use client';

import { useEffect, useState, useCallback } from 'react';
import { ui } from '@/lib/admin-ui';
import { getAvailableTimeSlots, getScheduleForDayFromConfig } from '@/lib/schedule';
import type { ScheduleConfig } from '@/lib/schedule';
import { DEFAULT_SCHEDULE } from '@/lib/tenant/defaults';
import { DEFAULT_SLOT_STEP_MINUTES } from '@/lib/slot-step';
import { buildScheduleSummary, scheduleSummaryDotClass } from '@/lib/schedule-summary';
import { formatColombiaTime, toColombiaDateString } from '@/lib/date-utils';
import { tenantApiUrl } from '@/lib/tenant/client-api';
import { useToast } from '@/components/ToastProvider';

type BlockedSlot = {
  id: string;
  barberId: string;
  date: string;
  isFullDay: boolean;
  time: string | null;
  reason: string | null;
};

const DIAS_SEMANA = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const MESES_ES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

function buildCalendarDays(year: number, month: number): (number | null)[] {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startOffset = firstDay.getDay();
  const daysInMonth = lastDay.getDate();
  const days: (number | null)[] = [];
  for (let i = 0; i < startOffset; i++) days.push(null);
  for (let d = 1; d <= daysInMonth; d++) days.push(d);
  return days;
}

// Crea YYYY-MM-DD desde una fecha local (para enviar al API)
function formatDateStr(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

// Extrae YYYY-MM-DD de una fecha ISO del servidor (usando UTC para evitar problemas de timezone)
function blockDateStr(isoDate: string): string {
  const d = new Date(isoDate);
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
}

interface HorariosContentProps {
  readonly barberId: string;
  readonly barberName: string;
}

export default function HorariosContent({ barberId, barberName }: HorariosContentProps) {
  const toast = useToast();
  const [blocks, setBlocks] = useState<BlockedSlot[]>([]);
  const [blocksLoading, setBlocksLoading] = useState(false);
  const [bookedMap, setBookedMap] = useState<Map<string, Set<string>>>(new Map());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [saving, setSaving] = useState(false);
  const [slotStepMinutes, setSlotStepMinutes] = useState(DEFAULT_SLOT_STEP_MINUTES);
  const [scheduleJson, setScheduleJson] = useState<ScheduleConfig>(DEFAULT_SCHEDULE);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const [displayMonth, setDisplayMonth] = useState(new Date(today.getFullYear(), today.getMonth(), 1));

  // Cargar bloqueos del mes
  const loadBlocks = useCallback(() => {
    if (!barberId) return;
    setBlocksLoading(true);
    const monthStr = `${displayMonth.getFullYear()}-${String(displayMonth.getMonth() + 1).padStart(2, '0')}`;
    fetch(`/api/admin/blocked-slots?barberId=${barberId}&month=${monthStr}`, {
      cache: 'no-store',
      headers: { 'Cache-Control': 'no-cache' },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setBlocks(data.data || []);
        }
      })
      .catch((err) => console.error('Error cargando bloqueos:', err))
      .finally(() => setBlocksLoading(false));
  }, [barberId, displayMonth]);

  useEffect(() => {
    loadBlocks();
  }, [loadBlocks]);

  const loadBookings = useCallback(() => {
    if (!barberId) return;
    fetch(tenantApiUrl('/api/bookings/mis-reservas'))
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data) {
          const map = new Map<string, Set<string>>();
          for (const b of data.data as { dateTime: string }[]) {
            const dt = new Date(b.dateTime);
            const dateKey = toColombiaDateString(dt);
            const timeKey = formatColombiaTime(dt);
            if (!map.has(dateKey)) map.set(dateKey, new Set());
            map.get(dateKey)!.add(timeKey);
          }
          setBookedMap(map);
        }
      })
      .catch(() => {});
  }, [barberId]);

  useEffect(() => {
    loadBookings();
  }, [loadBookings]);

  useEffect(() => {
    fetch(tenantApiUrl('/api/admin/settings'))
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data?.scheduleJson) {
          setScheduleJson(data.data.scheduleJson as ScheduleConfig);
        }
      })
      .catch(() => {});

    fetch(tenantApiUrl('/api/services'))
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.data) && data.data.length > 0) {
          const min = Math.min(
            ...data.data.map((s: { durationMinutes: number }) => s.durationMinutes)
          );
          setSlotStepMinutes(min);
        }
      })
      .catch(() => {});
  }, []);

  // Fecha seleccionada como string YYYY-MM-DD (local)
  const selectedDateStr = selectedDate ? formatDateStr(selectedDate) : '';

  // Slots del día seleccionado
  const selectedDateSlots = selectedDate
    ? getAvailableTimeSlots(selectedDate, scheduleJson, slotStepMinutes, slotStepMinutes)
    : [];

  const scheduleSummary = buildScheduleSummary(scheduleJson, slotStepMinutes);

  // Filtrar bloqueos del día seleccionado comparando strings YYYY-MM-DD
  const dayBlocks = blocks.filter((b) => {
    if (!selectedDateStr) return false;
    return blockDateStr(b.date) === selectedDateStr;
  });

  const isFullDayBlocked = dayBlocks.some((b) => b.isFullDay);
  const blockedTimes = new Set(dayBlocks.filter((b) => !b.isFullDay && b.time).map((b) => b.time!));

  const bookedTimesForDay = selectedDateStr ? (bookedMap.get(selectedDateStr) ?? new Set<string>()) : new Set<string>();
  const dayHasBookings = bookedTimesForDay.size > 0;

  // Mapa de días bloqueados en el mes para el calendario
  const blockedDaysMap = new Map<string, 'full' | 'partial'>();
  blocks.forEach((b) => {
    const key = blockDateStr(b.date);
    if (b.isFullDay) {
      blockedDaysMap.set(key, 'full');
    } else if (!blockedDaysMap.has(key) || blockedDaysMap.get(key) !== 'full') {
      blockedDaysMap.set(key, 'partial');
    }
  });

  const showMessage = (type: 'success' | 'error', text: string) => {
    if (type === 'success') toast.success(text);
    else toast.error(text);
  };

  // Bloquear día completo
  const blockFullDay = async () => {
    if (!barberId || !selectedDate) return;
    setSaving(true);
    try {
      const res = await fetch(tenantApiUrl('/api/admin/blocked-slots'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          barberId,
          date: selectedDateStr,
          isFullDay: true,
          reason: 'Día bloqueado por barbero',
        }),
      });
      const data = await res.json();
      if (data.success) {
        showMessage('success', 'Día bloqueado correctamente');
        loadBlocks();
      } else {
        showMessage('error', data.error || 'Error al bloquear');
      }
    } catch {
      showMessage('error', 'Error de conexión');
    } finally {
      setSaving(false);
    }
  };

  // Desbloquear día completo
  const unblockFullDay = async () => {
    if (!barberId || !selectedDate) return;
    setSaving(true);
    try {
      const res = await fetch(
        `/api/admin/blocked-slots?barberId=${barberId}&date=${selectedDateStr}`,
        { method: 'DELETE' }
      );
      const data = await res.json();
      if (data.success) {
        showMessage('success', 'Día desbloqueado correctamente');
        loadBlocks();
      } else {
        showMessage('error', data.error || 'Error al desbloquear');
      }
    } catch {
      showMessage('error', 'Error de conexión');
    } finally {
      setSaving(false);
    }
  };

  // Alternar bloqueo de un turno específico
  const toggleSlotBlock = async (slot: string) => {
    if (!barberId || !selectedDate) return;
    setSaving(true);
    const isBlocked = blockedTimes.has(slot);
    try {
      if (isBlocked) {
        const res = await fetch(
          `/api/admin/blocked-slots?barberId=${barberId}&date=${selectedDateStr}&time=${encodeURIComponent(slot)}`,
          { method: 'DELETE' }
        );
        const data = await res.json();
        if (data.success) {
          showMessage('success', `${slot} desbloqueado`);
          loadBlocks();
        } else {
          showMessage('error', data.error || 'Error');
        }
      } else {
        const res = await fetch(tenantApiUrl('/api/admin/blocked-slots'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            barberId,
            date: selectedDateStr,
            isFullDay: false,
            time: slot,
          }),
        });
        const data = await res.json();
        if (data.success) {
          showMessage('success', `${slot} bloqueado`);
          loadBlocks();
        } else {
          showMessage('error', data.error || 'Error');
        }
      }
    } catch {
      showMessage('error', 'Error de conexión');
    } finally {
      setSaving(false);
    }
  };

  const canGoPrev =
    displayMonth.getFullYear() > today.getFullYear() ||
    (displayMonth.getFullYear() === today.getFullYear() && displayMonth.getMonth() > today.getMonth());

  const maxDate = new Date(today);
  maxDate.setDate(maxDate.getDate() + 90);

  const canGoNext =
    displayMonth.getFullYear() < maxDate.getFullYear() ||
    (displayMonth.getFullYear() === maxDate.getFullYear() && displayMonth.getMonth() < maxDate.getMonth());

  const hasSchedule = selectedDate
    ? getScheduleForDayFromConfig(selectedDate.getDay(), scheduleJson) !== null
    : false;

  return (
    <div className={ui.page}>
      <div>
        <h1 className={ui.title}>Mis Horarios</h1>
        <p className={ui.subtitle}>
          {barberName}, bloquea días completos o turnos específicos de tu agenda
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Calendario */}
        <div className="flex-shrink-0 w-full lg:w-auto">
          <div className="glass-card inline-block w-full max-w-sm overflow-hidden rounded-2xl">
            <div className="flex items-center justify-between border-b border-white/10 bg-white/5 px-4 py-3">
              <button
                type="button"
                disabled={!canGoPrev}
                onClick={() =>
                  canGoPrev &&
                  setDisplayMonth(new Date(displayMonth.getFullYear(), displayMonth.getMonth() - 1, 1))
                }
                className="h-9 w-9 flex items-center justify-center rounded-lg bg-white/15 text-white hover:bg-white/25 active:bg-white/35 transition-colors text-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                &#8249;
              </button>
              <span className="text-white font-semibold text-sm">
                {MESES_ES[displayMonth.getMonth()]} {displayMonth.getFullYear()}
              </span>
              <button
                type="button"
                disabled={!canGoNext}
                onClick={() =>
                  canGoNext &&
                  setDisplayMonth(new Date(displayMonth.getFullYear(), displayMonth.getMonth() + 1, 1))
                }
                className="h-9 w-9 flex items-center justify-center rounded-lg bg-white/15 text-white hover:bg-white/25 active:bg-white/35 transition-colors text-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                &#8250;
              </button>
            </div>
            <div className="grid grid-cols-7 gap-0 border-b border-white/10 bg-white/5 px-2 py-2">
              {DIAS_SEMANA.map((d) => (
                <span key={d} className="text-center text-[10px] font-semibold uppercase tracking-wider text-white/45">
                  {d}
                </span>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-0.5 p-3">
              {buildCalendarDays(displayMonth.getFullYear(), displayMonth.getMonth()).map((day, idx) => {
                const year = displayMonth.getFullYear();
                const month = displayMonth.getMonth();
                if (day === null) return <div key={`empty-${year}-${month}-${idx}`} />;
                const date = new Date(year, month, day);
                const dateStr = formatDateStr(date);
                const isPast = date < today;
                const isTooFar = date > maxDate;
                const disabled = isPast || isTooFar;
                const isSelected =
                  selectedDate?.getFullYear() === year &&
                  selectedDate?.getMonth() === month &&
                  selectedDate?.getDate() === day;

                const blockStatus = blockedDaysMap.get(dateStr);
                const isFullBlocked = blockStatus === 'full';
                const isPartialBlocked = blockStatus === 'partial';
                const hasBookingsOnDay = bookedMap.has(dateStr);

                let dayClass = 'text-white/90 hover:bg-white/10';
                if (disabled) dayClass = 'text-white/25 cursor-not-allowed';
                else if (isSelected) dayClass = 'bg-amber-500/30 text-white shadow-md ring-1 ring-amber-400/50';
                else if (isFullBlocked) dayClass = 'bg-red-500/20 text-red-300 hover:bg-red-500/30 font-semibold';
                else if (isPartialBlocked) dayClass = 'bg-amber-500/20 text-amber-300 hover:bg-amber-500/30';

                return (
                  <button
                    key={`${year}-${month}-${day}`}
                    type="button"
                    disabled={disabled}
                    onClick={() => !disabled && setSelectedDate(date)}
                    className={`relative aspect-square min-h-[36px] w-full max-w-[44px] mx-auto rounded-xl text-xs font-medium transition-all ${dayClass}`}
                    title={
                      isFullBlocked
                        ? 'Día bloqueado'
                        : (isPartialBlocked ? 'Algunos turnos bloqueados' : '')
                    }
                  >
                    {day}
                    {hasBookingsOnDay && !disabled && (
                      <span className={`absolute bottom-0.5 left-1/2 -translate-x-1/2 h-1 w-1 rounded-full ${isSelected ? 'bg-blue-300' : 'bg-blue-500'}`} />
                    )}
                  </button>
                );
              })}
            </div>
            <div className="flex flex-wrap items-center justify-center gap-3 border-t border-white/10 px-4 py-2 text-[10px] text-white/45">
              <span className="flex items-center gap-1">
                <span className="h-2.5 w-2.5 rounded-sm border border-red-400/40 bg-red-500/20" />
                Bloqueado
              </span>
              <span className="flex items-center gap-1">
                <span className="h-2.5 w-2.5 rounded-sm border border-amber-400/40 bg-amber-500/20" />
                Parcial
              </span>
              <span className="flex items-center gap-1">
                <span className="h-2.5 w-2.5 rounded-sm border border-blue-400/40 bg-blue-500/20" />
                Reservado
              </span>
            </div>
          </div>
        </div>

        {/* Panel de turnos del día seleccionado */}
        <div className="flex-1 min-w-0">
          {!selectedDate && (
            <div className={`${ui.empty} text-white/50`}>
              <p>Selecciona una fecha en el calendario para gestionar tus turnos</p>
            </div>
          )}
          {selectedDate && !hasSchedule && (
            <div className={`${ui.empty} text-white/50`}>
              <p>Este día no tiene horario configurado</p>
            </div>
          )}
          {selectedDate && hasSchedule && (
            <div className="glass-card overflow-hidden rounded-2xl">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 bg-white/5 px-4 py-3">
                <div>
                  <h3 className="font-semibold text-white/90">
                    {selectedDate.getDate()} de {MESES_ES[selectedDate.getMonth()]}
                  </h3>
                  <p className="mt-0.5 text-xs text-white/45">
                    {DIAS_SEMANA[selectedDate.getDay()]} · {selectedDateSlots.length} turnos · cada{' '}
                    {slotStepMinutes} min
                  </p>
                </div>
                <div className="flex gap-2">
                  {isFullDayBlocked ? (
                    <button
                      type="button"
                      disabled={saving}
                      onClick={unblockFullDay}
                      className={ui.btnPrimary}
                    >
                      Desbloquear día
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled={saving || dayHasBookings}
                      onClick={blockFullDay}
                      title={dayHasBookings ? 'No se puede bloquear el día porque hay citas reservadas' : ''}
                      className={ui.btnDanger}
                    >
                      Bloquear día completo
                    </button>
                  )}
                </div>
              </div>

              {isFullDayBlocked ? (
                <div className="p-6 text-center">
                  <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-red-500/20">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-7 w-7 text-red-300">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 0 0 5.636 5.636m12.728 12.728A9 9 0 0 1 5.636 5.636m12.728 12.728L5.636 5.636" />
                    </svg>
                  </div>
                  <p className="font-medium text-white/90">Día completamente bloqueado</p>
                  <p className="mt-1 text-sm text-white/45">No se aceptarán reservas para este día</p>
                </div>
              ) : (
                <div className="p-4">
                  <p className={`mb-3 ${ui.muted}`}>
                    Toca un turno para bloquearlo/desbloquearlo. Los turnos rojos están bloqueados.
                  </p>
                  {dayHasBookings && (
                    <div className="mb-3 flex items-center gap-2 rounded-xl border border-amber-400/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-300">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-4 w-4 shrink-0">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
                      </svg>
                      Hay {bookedTimesForDay.size} {bookedTimesForDay.size === 1 ? 'cita reservada' : 'citas reservadas'} este día. No puedes bloquear el día completo ni los turnos con reserva.
                    </div>
                  )}
                  {blocksLoading ? (
                    <div className="flex justify-center py-8">
                      <div className={ui.spinner} />
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
                      {selectedDateSlots.map((slot) => {
                        const isBlocked = blockedTimes.has(slot);
                        const isBooked = bookedTimesForDay.has(slot);
                        return (
                          <button
                            key={slot}
                            type="button"
                            disabled={saving || isBooked}
                            onClick={() => toggleSlotBlock(slot)}
                            className={`min-h-[44px] px-2 py-2.5 rounded-xl border-2 text-sm font-medium transition-all ${
                              isBooked
                                ? 'border-blue-400/40 bg-blue-500/15 text-blue-300 cursor-not-allowed opacity-90'
                                : isBlocked
                                  ? 'border-red-400/40 bg-red-500/15 text-red-300 hover:bg-red-500/25 disabled:opacity-50'
                                  : 'border-white/10 bg-white/5 text-white/90 hover:border-white/25 hover:bg-white/10 disabled:opacity-50'
                            }`}
                          >
                            <span>{slot}</span>
                            {isBooked && (
                              <span className="mt-0.5 block text-[10px] text-blue-400">Reservado</span>
                            )}
                            {isBlocked && !isBooked && (
                              <span className="mt-0.5 block text-[10px] text-red-400">Bloqueado</span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className={ui.card}>
        <h3 className={`mb-3 text-sm ${ui.sectionTitle}`}>Horarios configurados</h3>
        <div className="space-y-2 text-sm text-white/70">
          {scheduleSummary.map((line) => (
            <div key={`${line.kind}-${line.label}-${line.detail}`} className="flex items-start gap-2">
              <span
                className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${scheduleSummaryDotClass(line.color)}`}
              />
              <span>
                <strong className="text-white/90">{line.label}:</strong> {line.detail}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
