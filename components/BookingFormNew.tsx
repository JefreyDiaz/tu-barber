'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { z } from 'zod';
import { tenantApiUrl, tenantHref } from '@/lib/tenant/client-api';

type ServiceOption = { id: string; name: string; durationMinutes: number };

const MESES_ES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

const DIAS_SEMANA = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

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

function sameDate(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

const bookingFormSchema = z.object({
  customerName: z.string().min(2).max(50).trim(),
  customerPhone: z.string().regex(/^\d{10}$/, 'Ingresa 10 dígitos, sin espacios ni guiones'),
});

interface BookingFormProps {
  readonly barberId: string;
  readonly barberName: string;
  readonly onSuccess?: () => void;
}

export default function BookingForm({ barberId, barberName, onSuccess }: BookingFormProps) {
  const router = useRouter();
  const homeHref = tenantHref('/');

  const [selectedServiceId, setSelectedServiceId] = useState<string>('');
  const [services, setServices] = useState<ServiceOption[]>([]);
  const [servicesLoading, setServicesLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({ customerName: '', customerPhone: '' });
  const [datesWithNoSlots, setDatesWithNoSlots] = useState<Set<string>>(new Set());
  const [countdown, setCountdown] = useState(10);

  const today = (() => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; })();
  const minDate = new Date(today);
  const maxDate = new Date(today);
  maxDate.setDate(maxDate.getDate() + 30);

  const [displayMonth, setDisplayMonth] = useState<Date>(() => new Date(today.getFullYear(), today.getMonth(), 1));
  const goToMonth = (d: Date) => setDisplayMonth(new Date(d.getFullYear(), d.getMonth(), 1));

  const canGoPrev =
    displayMonth.getFullYear() > today.getFullYear() ||
    (displayMonth.getFullYear() === today.getFullYear() && displayMonth.getMonth() > today.getMonth());
  const canGoNext =
    displayMonth.getFullYear() < maxDate.getFullYear() ||
    (displayMonth.getFullYear() === maxDate.getFullYear() && displayMonth.getMonth() < maxDate.getMonth());

  useEffect(() => {
    setServicesLoading(true);
    fetch(tenantApiUrl('/api/services'))
      .then((res) => res.json())
      .then((data) => {
        const list = data?.success ? (data.data as ServiceOption[]) : [];
        setServices(list);
        if (list.length > 0) setSelectedServiceId(list[0].id);
      })
      .catch(console.error)
      .finally(() => setServicesLoading(false));
  }, []);

  useEffect(() => {
    if (!selectedDate || !selectedServiceId) {
      setAvailableSlots([]);
      setSelectedTime('');
      return;
    }
    setLoading(true);
    const dateStr = selectedDate.toISOString().split('T')[0];
    fetch(
      tenantApiUrl(
        `/api/bookings/available?barberId=${encodeURIComponent(barberId)}&date=${dateStr}&serviceId=${encodeURIComponent(selectedServiceId)}`
      )
    )
      .then((res) => res.json())
      .then((data) => {
        const slots = data?.success ? (data.data || []) : [];
        setAvailableSlots(slots);
        setSelectedTime((prev) => (slots.includes(prev) ? prev : ''));
        if (slots.length === 0) {
          setDatesWithNoSlots((prev) => new Set(prev).add(dateStr));
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [selectedDate, barberId, selectedServiceId]);

  useEffect(() => {
    if (!selectedServiceId) return;
    const todayStr = today.toISOString().split('T')[0];
    if (datesWithNoSlots.has(todayStr)) return;
    fetch(
      tenantApiUrl(
        `/api/bookings/available?barberId=${encodeURIComponent(barberId)}&date=${todayStr}&serviceId=${encodeURIComponent(selectedServiceId)}`
      )
    )
      .then((res) => res.json())
      .then((data) => {
        const slots = data?.success ? (data.data || []) : [];
        if (slots.length === 0) {
          setDatesWithNoSlots((prev) => new Set(prev).add(todayStr));
        }
      })
      .catch(() => {});
  }, [barberId, selectedServiceId]);

  useEffect(() => {
    if (!success) return;
    const countdownInterval = setInterval(() => {
      setCountdown((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    const redirectTimer = setTimeout(() => router.push(homeHref), 10000);
    return () => {
      clearInterval(countdownInterval);
      clearTimeout(redirectTimer);
    };
  }, [success, router, homeHref]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setSuccess(false);
    if (!selectedDate || !selectedTime || !selectedServiceId) {
      setErrors({ general: 'Selecciona servicio, fecha y hora' });
      return;
    }
    const parsed = bookingFormSchema.safeParse(formData);
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      parsed.error.issues.forEach((err) => {
        const key = err.path[0] as string | undefined;
        if (key) fieldErrors[key] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }
    setSubmitting(true);
    try {
      const body = {
        barberId,
        serviceId: selectedServiceId,
        customerName: parsed.data.customerName,
        customerPhone: parsed.data.customerPhone,
        date: selectedDate.toISOString().split('T')[0],
        time: selectedTime,
      };
      const res = await fetch(tenantApiUrl('/api/bookings'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data?.success) {
        setSuccess(true);
        onSuccess?.();
        setFormData({ customerName: '', customerPhone: '' });
        setSelectedDate(undefined);
        setSelectedTime('');
        setAvailableSlots([]);
      } else {
        setErrors({ general: data?.error || 'Error al crear la reserva' });
      }
    } catch (err) {
      console.error(err);
      setErrors({ general: 'Error al crear la reserva. Por favor intenta de nuevo.' });
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="flex min-h-[70vh] w-full items-center justify-center px-2 sm:px-0">
        <div className="glass-card-strong w-full max-w-xl min-w-0 p-6 text-center sm:p-8 animate-scale-in">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/20 text-2xl text-emerald-300">
            ✓
          </div>
          <h2 className="mb-2 text-xl font-bold text-white sm:text-2xl">¡Reserva confirmada!</h2>
          <p className="mb-4 text-sm text-white/60 sm:text-base">
            Tu cita con {barberName} ha sido creada exitosamente.
          </p>
          <p className="mb-6 text-xs text-white/40 sm:text-sm">
            Redirigiendo al inicio en {countdown} segundos...
          </p>
          <a href={homeHref} className="btn-accent inline-block min-h-[48px] rounded-2xl px-6 py-3 touch-manipulation">
            Volver al inicio
          </a>
        </div>
      </div>
    );
  }

  const formatSelectedDate = selectedDate
    ? `${selectedDate.getDate()} de ${MESES_ES[selectedDate.getMonth()]}`
    : '';

  const selectedService = services.find((s) => s.id === selectedServiceId);

  return (
    <form onSubmit={handleSubmit} className="glass-card-strong w-full min-w-0 rounded-2xl p-4 sm:p-6 md:p-8">
      <div className="mb-6 sm:mb-8">
        <h2 className="mb-3 text-lg font-semibold text-white sm:text-xl">Tipo de servicio</h2>
        {servicesLoading && <p className="text-sm text-white/45">Cargando servicios...</p>}
        {!servicesLoading && services.length === 0 && (
          <p className="rounded-xl border brand-border brand-bg-soft px-4 py-3 text-sm brand-accent-soft">
            Esta barbería aún no tiene servicios configurados.
          </p>
        )}
        {!servicesLoading && services.length > 0 && (
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3 sm:gap-3">
            {services.map((svc) => (
              <button
                key={svc.id}
                type="button"
                onClick={() => {
                  setSelectedServiceId(svc.id);
                  setSelectedTime('');
                }}
                className={`rounded-xl border-2 p-4 text-left transition-all ${
                  selectedServiceId === svc.id
                    ? 'plan-card-selected brand-border brand-bg-soft'
                    : 'glass-card border-white/10 hover:border-white/20'
                }`}
              >
                <p className="font-semibold text-white">{svc.name}</p>
                <p className="mt-1 text-sm text-white/45">{svc.durationMinutes} min</p>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="mb-6 flex flex-col gap-6 sm:mb-8 md:flex-row md:items-start md:gap-8">
        <div className="w-full min-w-0 flex-shrink-0 md:w-auto">
          <h2 className="mb-3 text-lg font-semibold text-white sm:mb-4 sm:text-xl">Selecciona una fecha</h2>
          <div className="glass-card mx-auto inline-block w-full max-w-sm overflow-hidden rounded-2xl md:mx-0">
            <div className="flex items-center justify-between border-b border-white/10 bg-white/5 px-3 py-3 sm:px-5 sm:py-4">
              <button
                type="button"
                disabled={!canGoPrev}
                onClick={() => canGoPrev && goToMonth(new Date(displayMonth.getFullYear(), displayMonth.getMonth() - 1, 1))}
                className="btn-glass flex h-9 min-h-[36px] w-9 min-w-[36px] items-center justify-center rounded-lg text-lg font-medium disabled:opacity-40"
                aria-label="Mes anterior"
              >
                ‹
              </button>
              <span className="truncate px-1 text-sm font-semibold text-white sm:text-base md:text-lg">
                {MESES_ES[displayMonth.getMonth()]} {displayMonth.getFullYear()}
              </span>
              <button
                type="button"
                disabled={!canGoNext}
                onClick={() => canGoNext && goToMonth(new Date(displayMonth.getFullYear(), displayMonth.getMonth() + 1, 1))}
                className="btn-glass flex h-9 min-h-[36px] w-9 min-w-[36px] items-center justify-center rounded-lg text-lg font-medium disabled:opacity-40"
                aria-label="Mes siguiente"
              >
                ›
              </button>
            </div>
            <div className="grid grid-cols-7 gap-0 border-b border-white/10 bg-white/[0.03] px-1 py-2 sm:px-2">
              {DIAS_SEMANA.map((d) => (
                <span key={d} className="truncate text-center text-[10px] font-semibold uppercase tracking-wider text-white/40 sm:text-xs">
                  {d}
                </span>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-0.5 p-2 sm:gap-1 sm:p-4">
              {buildCalendarDays(displayMonth.getFullYear(), displayMonth.getMonth()).map((day, idx) => {
                const year = displayMonth.getFullYear();
                const month = displayMonth.getMonth();
                if (day === null) return <div key={`empty-${year}-${month}-${idx}`} />;
                const date = new Date(year, month, day);
                const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                const isPast = date < minDate;
                const isFuture = date > maxDate;
                const noSlots = datesWithNoSlots.has(dateStr);
                const disabled = isPast || isFuture || noSlots;
                const isToday = sameDate(date, new Date());
                const isSelected = selectedDate ? sameDate(date, selectedDate) : false;

                let dayClass = 'text-white/80 hover:bg-white/10';
                if (disabled) dayClass = 'cursor-not-allowed text-white/20';
                else if (isSelected) dayClass = 'btn-accent font-semibold shadow-md';
                else if (isToday) dayClass = 'bg-white/15 font-bold text-white brand-ring';

                return (
                  <button
                    key={`${year}-${month}-${day}`}
                    type="button"
                    disabled={disabled}
                    onClick={() => !disabled && setSelectedDate(date)}
                    className={`mx-auto aspect-square w-full max-w-[44px] min-h-[36px] min-w-0 touch-manipulation rounded-xl text-xs font-medium transition-all sm:text-sm ${dayClass}`}
                  >
                    {day}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="flex w-full min-w-0 flex-1 flex-col md:w-auto">
          <h2 className="mb-3 text-lg font-semibold text-white sm:mb-4 sm:text-xl">
            Horarios disponibles
            {selectedService && (
              <span className="mt-1 block text-sm font-normal text-white/45">
                {selectedService.name} · {selectedService.durationMinutes} min
              </span>
            )}
          </h2>
          <div className="glass-card min-h-0 flex-1 rounded-2xl p-4 sm:p-5 md:min-h-[340px] md:p-6">
            {!selectedDate && (
              <p className="text-sm text-white/45">
                Selecciona una fecha en el calendario para ver los horarios disponibles.
              </p>
            )}
            {selectedDate && (
              <>
                {(loading || availableSlots.length > 0) && (
                  <p className="mb-4 text-sm brand-accent">{formatSelectedDate}</p>
                )}
                {loading && <div className="py-8 text-center text-white/45">Cargando horarios...</div>}
                {!loading && availableSlots.length === 0 && (
                  <p className="text-white/45">No hay horarios disponibles para esta fecha.</p>
                )}
                {!loading && availableSlots.length > 0 && (
                  <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 sm:gap-3">
                    {availableSlots.map((slot) => {
                      const isSlotSelected = selectedTime === slot;
                      return (
                        <button
                          key={slot}
                          type="button"
                          onClick={() => setSelectedTime(slot)}
                          className={`min-h-[44px] touch-manipulation rounded-xl border-2 px-3 py-3 text-sm font-medium transition-all sm:px-4 ${
                            isSlotSelected
                              ? 'btn-accent border-transparent shadow-lg'
                              : 'btn-glass border-white/10 brand-hover-border'
                          }`}
                        >
                          {slot}
                        </button>
                      );
                    })}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      <div className="space-y-4 border-t border-white/10 pt-6 sm:space-y-6">
        <h2 className="text-lg font-semibold text-white sm:text-xl">Datos de contacto</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="min-w-0">
            <label htmlFor="customerName" className="mb-2 block text-sm font-medium text-white/75">
              Nombre completo *
            </label>
            <input
              id="customerName"
              type="text"
              value={formData.customerName}
              onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
              className="glass-input w-full min-w-0 px-4 py-3 text-base"
              placeholder="Tu nombre"
            />
            {errors.customerName && <p className="mt-1 text-sm text-red-300">{errors.customerName}</p>}
          </div>
          <div className="min-w-0">
            <label htmlFor="customerPhone" className="mb-2 block text-sm font-medium text-white/75">
              Teléfono (WhatsApp) *
            </label>
            <input
              id="customerPhone"
              type="tel"
              inputMode="numeric"
              autoComplete="tel"
              maxLength={10}
              value={formData.customerPhone}
              onChange={(e) => {
                const digits = e.target.value.replaceAll(/\D/g, '').slice(0, 10);
                setFormData({ ...formData, customerPhone: digits });
              }}
              className="glass-input w-full min-w-0 px-4 py-3 text-base"
              placeholder="3001234567"
            />
            <p className="mt-1 text-xs text-white/40">10 dígitos, sin espacios ni guiones.</p>
            {errors.customerPhone && <p className="mt-1 text-sm text-red-300">{errors.customerPhone}</p>}
          </div>
        </div>

        {errors.general && (
          <div className="rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-300 sm:text-base">
            {errors.general}
          </div>
        )}

        <button
          type="submit"
          disabled={submitting || !selectedServiceId || !selectedDate || !selectedTime}
          className="btn-accent w-full min-h-[48px] touch-manipulation rounded-2xl py-3.5 text-base font-semibold disabled:cursor-not-allowed disabled:opacity-40"
        >
          {submitting ? 'Reservando...' : 'Confirmar reserva'}
        </button>
      </div>
    </form>
  );
}
