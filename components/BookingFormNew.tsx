'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { z } from 'zod';
import { tenantApiUrl } from '@/lib/tenant/client-api';

type ServiceOption = { id: string; name: string; durationMinutes: number };

const MESES_ES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

const DIAS_SEMANA = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

function buildCalendarDays(year: number, month: number): (number | null)[] {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startOffset = firstDay.getDay(); // 0 = Domingo
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
  const [selectedServiceId, setSelectedServiceId] = useState<string>('');
  const [services, setServices] = useState<ServiceOption[]>([]);
  const [servicesLoading, setServicesLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string,string>>({});
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({ customerName: '', customerPhone: '' });
  const [datesWithNoSlots, setDatesWithNoSlots] = useState<Set<string>>(new Set());
  const [countdown, setCountdown] = useState(10);

  const today = (() => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; })();
  const minDate = new Date(today); // mismo día disponible
  const maxDate = new Date(today); maxDate.setDate(maxDate.getDate() + 30);

  const [displayMonth, setDisplayMonth] = useState<Date>(() => new Date(today.getFullYear(), today.getMonth(), 1));
  const goToMonth = (d: Date) => setDisplayMonth(new Date(d.getFullYear(), d.getMonth(), 1));

  const canGoPrev = displayMonth.getFullYear() > today.getFullYear() ||
    (displayMonth.getFullYear() === today.getFullYear() && displayMonth.getMonth() > today.getMonth());
  const canGoNext = displayMonth.getFullYear() < maxDate.getFullYear() ||
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
      .then(res => res.json())
      .then(data => {
        const slots = data?.success ? (data.data || []) : [];
        setAvailableSlots(slots);
        // Si la hora seleccionada ya no está disponible (ej. ya pasó), limpiarla
        setSelectedTime((prev) => (slots.includes(prev) ? prev : ''));
        // Si no hay horarios, marcar esta fecha como no seleccionable en el calendario
        if (slots.length === 0) {
          setDatesWithNoSlots((prev) => new Set(prev).add(dateStr));
        }
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, [selectedDate, barberId, selectedServiceId]);

  // Al cargar, comprobar si hoy tiene horarios
  useEffect(() => {
    if (!selectedServiceId) return;
    const todayStr = today.toISOString().split('T')[0];
    if (datesWithNoSlots.has(todayStr)) return;
    fetch(
      tenantApiUrl(
        `/api/bookings/available?barberId=${encodeURIComponent(barberId)}&date=${todayStr}&serviceId=${encodeURIComponent(selectedServiceId)}`
      )
    )
      .then(res => res.json())
      .then(data => {
        const slots = data?.success ? (data.data || []) : [];
        if (slots.length === 0) {
          setDatesWithNoSlots((prev) => new Set(prev).add(todayStr));
        }
      })
      .catch(() => {});
  }, [barberId, selectedServiceId]);

  // Redirección automática después de confirmar reserva
  useEffect(() => {
    if (!success) return;
    
    // Cuenta regresiva
    const countdownInterval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(countdownInterval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // Redirección después de 10 segundos
    const redirectTimer = setTimeout(() => {
      router.push('/');
    }, 10000);

    return () => {
      clearInterval(countdownInterval);
      clearTimeout(redirectTimer);
    };
  }, [success, router]);

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
      const fieldErrors: Record<string,string> = {};
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
      <div className="w-full min-h-[70vh] flex items-center justify-center px-2 sm:px-0">
        <div className="bg-white rounded-xl shadow-xl p-6 sm:p-8 text-center w-full min-w-0 max-w-xl">
          <h2 className="text-xl font-bold text-gray-900 mb-2 sm:text-2xl">¡Reserva confirmada!</h2>
          <p className="text-gray-600 mb-4 text-sm sm:text-base">Tu reserva con {barberName} ha sido creada exitosamente.</p>
          <p className="text-gray-400 text-xs sm:text-sm mb-6">Redirigiendo al inicio en {countdown} segundos...</p>
          <a href="/" className="inline-block min-h-[48px] px-6 py-3 bg-gradient-to-r from-gray-800 to-gray-900 text-white rounded-lg hover:from-gray-700 hover:to-gray-800 active:from-gray-900 active:to-black transition-all touch-manipulation shadow-lg">Volver al inicio</a>
        </div>
      </div>
    );
  }

  const formatSelectedDate = selectedDate
    ? `${selectedDate.getDate()} de ${MESES_ES[selectedDate.getMonth()]}`
    : '';

  const selectedService = services.find((s) => s.id === selectedServiceId);

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-xl p-4 sm:p-6 md:p-8 w-full min-w-0">
      <div className="mb-6 sm:mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-3 sm:text-xl">Tipo de servicio</h2>
        {servicesLoading && <p className="text-gray-500 text-sm">Cargando servicios...</p>}
        {!servicesLoading && services.length === 0 && (
          <p className="text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-sm">
            Esta barbería aún no tiene servicios configurados.
          </p>
        )}
        {!servicesLoading && services.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3">
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
                    ? 'border-gray-800 bg-gray-50 shadow-md'
                    : 'border-gray-200 hover:border-gray-400'
                }`}
              >
                <p className="font-semibold text-gray-900">{svc.name}</p>
                <p className="text-sm text-gray-500 mt-1">{svc.durationMinutes} min</p>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="flex flex-col md:flex-row md:gap-8 md:items-start gap-6 mb-6 sm:mb-8">
        {/* Calendario - izquierda */}
        <div className="flex-shrink-0 w-full min-w-0 md:w-auto">
          <h2 className="text-lg font-semibold text-gray-900 mb-3 sm:text-xl sm:mb-4">Selecciona una fecha</h2>
          <div className="inline-block w-full max-w-sm mx-auto md:mx-0 rounded-2xl border border-gray-200 bg-white shadow-lg overflow-hidden">
            <div className="flex items-center justify-between bg-gradient-to-r from-gray-800 via-gray-900 to-black px-3 py-3 sm:px-5 sm:py-4">
              <button
                type="button"
                disabled={!canGoPrev}
                onClick={() => canGoPrev && goToMonth(new Date(displayMonth.getFullYear(), displayMonth.getMonth() - 1, 1))}
                className="h-9 w-9 min-w-[36px] min-h-[36px] flex items-center justify-center rounded-lg bg-white/15 text-white hover:bg-white/25 active:bg-white/35 transition-colors text-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white/15 touch-manipulation"
                aria-label="Mes anterior"
              >
                ‹
              </button>
              <span className="text-white font-semibold text-sm sm:text-base md:text-lg truncate px-1">
                {MESES_ES[displayMonth.getMonth()]} {displayMonth.getFullYear()}
              </span>
              <button
                type="button"
                disabled={!canGoNext}
                onClick={() => canGoNext && goToMonth(new Date(displayMonth.getFullYear(), displayMonth.getMonth() + 1, 1))}
                className="h-9 w-9 min-w-[36px] min-h-[36px] flex items-center justify-center rounded-lg bg-white/15 text-white hover:bg-white/25 active:bg-white/35 transition-colors text-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white/15 touch-manipulation"
                aria-label="Mes siguiente"
              >
                ›
              </button>
            </div>
            <div className="grid grid-cols-7 gap-0 border-b border-gray-100 bg-gray-50/80 px-1 sm:px-2 py-2">
              {DIAS_SEMANA.map((d) => (
                <span key={d} className="text-center text-[10px] sm:text-xs font-semibold text-gray-500 uppercase tracking-wider truncate">
                  {d}
                </span>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-0.5 sm:gap-1 p-2 sm:p-4">
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

                let dayClass = 'text-gray-700 hover:bg-gray-100 hover:text-gray-900';
                if (disabled) dayClass = 'text-gray-300 cursor-not-allowed';
                else if (isSelected) dayClass = 'bg-gradient-to-br from-gray-800 to-black text-white shadow-md hover:from-gray-700 hover:to-gray-900';
                else if (isToday) dayClass = 'bg-gray-200 text-gray-900 font-bold hover:bg-gray-300';

                return (
                  <button
                    key={`${year}-${month}-${day}`}
                    type="button"
                    disabled={disabled}
                    onClick={() => !disabled && setSelectedDate(date)}
                    className={`aspect-square min-h-[36px] min-w-0 w-full max-w-[44px] mx-auto rounded-xl text-xs sm:text-sm font-medium transition-all touch-manipulation ${dayClass}`}
                  >
                    {day}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Horarios - derecha: mismo nivel que el calendario (título fuera de la caja, como a la izquierda) */}
        <div className="flex-1 w-full min-w-0 md:w-auto flex flex-col">
          <h2 className="text-lg font-semibold text-gray-900 mb-3 sm:text-xl sm:mb-4">
            Horarios Disponibles
            {selectedService && (
              <span className="block text-sm font-normal text-gray-500 mt-1">
                Para {selectedService.name} ({selectedService.durationMinutes} min)
              </span>
            )}
          </h2>
          <div className="flex-1 min-h-0 md:min-h-[340px] rounded-2xl border border-gray-200 bg-gray-50/50 p-4 sm:p-5 md:p-6">
            {!selectedDate && (
              <p className="text-gray-500 text-sm">Selecciona una fecha en el calendario para ver los horarios disponibles.</p>
            )}
            {selectedDate && (
              <>
                {(loading || availableSlots.length > 0) && (
                  <p className="text-gray-600 text-sm mb-4">{formatSelectedDate}</p>
                )}
                {loading && <div className="py-8 text-center text-gray-500">Cargando horarios...</div>}
                {!loading && availableSlots.length === 0 && (
                  <p className="text-gray-500">No hay horarios disponibles para esta fecha.</p>
                )}
                {!loading && availableSlots.length > 0 && (
                                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 sm:gap-3">
                                    {availableSlots.map(slot => {
                                      const isSlotSelected = selectedTime === slot;
                                      return (
                                        <button
                                          key={slot}
                                          type="button"
                                          onClick={() => setSelectedTime(slot)}
                                          className={`min-h-[44px] px-3 py-3 sm:px-4 rounded-xl border-2 text-sm font-medium transition-all touch-manipulation ${
                                            isSlotSelected
                                              ? 'bg-gradient-to-br from-gray-800 to-black text-white border-gray-800 shadow-lg'
                                              : 'bg-white text-gray-700 border-gray-200 hover:border-gray-400 hover:bg-gray-100 active:bg-gray-200'
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

      <div className="space-y-4 sm:space-y-6">
        <h2 className="text-lg font-semibold text-gray-900 sm:text-xl">Datos de contacto</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="min-w-0">
            <label htmlFor="customerName" className="block text-sm font-medium text-gray-700 mb-2">Nombre completo *</label>
            <input id="customerName" type="text" value={formData.customerName} onChange={e => setFormData({...formData, customerName: e.target.value})}
              className="w-full min-w-0 px-4 py-3 sm:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-800 focus:border-gray-800 text-gray-900 placeholder-gray-400 text-base" placeholder="Tu nombre" />
            {errors.customerName && <p className="mt-1 text-sm text-red-600">{errors.customerName}</p>}
          </div>
          <div className="min-w-0">
            <label htmlFor="customerPhone" className="block text-sm font-medium text-gray-700 mb-2">Teléfono (WhatsApp) *</label>
            <input
              id="customerPhone"
              type="tel"
              inputMode="numeric"
              autoComplete="tel"
              maxLength={10}
              value={formData.customerPhone}
              onChange={e => {
                const digits = e.target.value.replaceAll(/\D/g, '').slice(0, 10);
                setFormData({ ...formData, customerPhone: digits });
              }}
              className="w-full min-w-0 px-4 py-3 sm:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-800 focus:border-gray-800 text-gray-900 placeholder-gray-400 text-base"
              placeholder="3001234567"
            />
            <p className="mt-1 text-xs text-gray-500">10 dígitos, sin espacios ni guiones.</p>
            {errors.customerPhone && <p className="mt-1 text-sm text-red-600">{errors.customerPhone}</p>}
          </div>
        </div>

        {errors.general && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm sm:text-base">{errors.general}</div>}

        <button type="submit" disabled={submitting || !selectedServiceId || !selectedDate || !selectedTime} className="w-full min-h-[48px] bg-gradient-to-r from-gray-800 via-gray-900 to-black text-white py-3 px-6 rounded-lg font-semibold hover:from-gray-700 hover:via-gray-800 hover:to-gray-900 active:from-gray-900 active:via-black active:to-black transition-all disabled:from-gray-400 disabled:via-gray-400 disabled:to-gray-400 disabled:cursor-not-allowed touch-manipulation text-base shadow-lg">
          {submitting ? 'Reservando...' : 'Confirmar reserva'}
        </button>
      </div>
    </form>
  );
}

