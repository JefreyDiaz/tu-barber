'use client';

import { useEffect, useState } from 'react';
import { ui } from '@/lib/admin-ui';
import { COLOMBIA_TZ } from '@/lib/date-utils';
import { useToast } from '@/components/ToastProvider';

type Booking = {
  id: string;
  customerName: string;
  customerPhone: string;
  dateTime: string;
  status: string;
  createdAt: string;
};

const toLocalDateString = (date: Date) => {
  const y = date.toLocaleString('en-CA', { timeZone: COLOMBIA_TZ, year: 'numeric' });
  const m = date.toLocaleString('en-CA', { timeZone: COLOMBIA_TZ, month: '2-digit' });
  const d = date.toLocaleString('en-CA', { timeZone: COLOMBIA_TZ, day: '2-digit' });
  return `${y}-${m}-${d}`;
};

const getTodayString = () => toLocalDateString(new Date());

export default function MisReservasPage() {
  const toast = useToast();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterDate, setFilterDate] = useState<string>(getTodayString());
  const [cancelTarget, setCancelTarget] = useState<Booking | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);

  useEffect(() => {
    fetch('/api/bookings/mis-reservas')
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setBookings(data.data ?? []);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const filteredBookings = filterDate
    ? bookings.filter((booking) => {
        const bookingDate = toLocalDateString(new Date(booking.dateTime));
        return bookingDate === filterDate;
      })
    : bookings;

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('es-ES', {
      timeZone: COLOMBIA_TZ,
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('es-CO', {
      timeZone: COLOMBIA_TZ,
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    }).toUpperCase();
  };

  const getSortedBookings = (items: Booking[]) =>
    items.toSorted((a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime());

  const openCancelModal = (booking: Booking) => {
    setCancelTarget(booking);
  };

  const closeCancelModal = () => {
    if (isCancelling) return;
    setCancelTarget(null);
  };

  const handleConfirmCancel = async () => {
    if (!cancelTarget) return;

    setIsCancelling(true);

    try {
      const response = await fetch(`/api/bookings/${cancelTarget.id}`, {
        method: 'PATCH',
      });
      const data = await response.json();

      if (!response.ok || !data.success) {
        toast.error(data.error || 'No se pudo cancelar la reserva');
        return;
      }

      setBookings((prev) => prev.filter((booking) => booking.id !== cancelTarget.id));
      toast.success(`Cita de las ${formatTime(cancelTarget.dateTime)} cancelada correctamente`);
      setCancelTarget(null);
    } catch {
      toast.error('Error de conexión. Intenta de nuevo.');
    } finally {
      setIsCancelling(false);
    }
  };

  const groupedBookings = filteredBookings.reduce((acc, booking) => {
    const dateKey = toLocalDateString(new Date(booking.dateTime));
    if (!acc[dateKey]) {
      acc[dateKey] = [];
    }
    acc[dateKey].push(booking);
    return acc;
  }, {} as Record<string, Booking[]>);

  const sortedDates = Object.keys(groupedBookings).sort((a, b) => a.localeCompare(b));

  const now = new Date();
  const todayStr = toLocalDateString(now);
  const futureDates = sortedDates.filter((d) => d >= todayStr);
  const pastDates = sortedDates.filter((d) => d < todayStr).reverse();

  return (
    <div className={ui.page}>
      <div>
        <h1 className={ui.title}>Mis Reservas</h1>
        <p className={ui.subtitle}>Gestiona tus citas programadas</p>
      </div>

      {/* Filtro de fecha */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <label htmlFor="filterDate" className={ui.label}>
            Filtrar por fecha:
          </label>
          <input
            type="date"
            id="filterDate"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
            className={ui.input}
          />
        </div>
        {filterDate && (
          <button
            type="button"
            onClick={() => setFilterDate('')}
            className={`flex items-center gap-1.5 ${ui.btnSecondary}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-4 w-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
            Limpiar filtro
          </button>
        )}
        {filterDate && (
          <span className={ui.muted}>
            Mostrando {filteredBookings.length} {filteredBookings.length === 1 ? 'reserva' : 'reservas'}
          </span>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className={ui.spinner} />
        </div>
      ) : filteredBookings.length === 0 ? (
        <div className={`${ui.empty} text-white/50`}>
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white/10">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="h-8 w-8 text-white/45"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5"
              />
            </svg>
          </div>
          <p className="text-white/90">
            {filterDate ? 'No tienes reservas para esta fecha' : 'No tienes reservas programadas'}
          </p>
          <p className="mt-1 text-sm text-white/45">
            {filterDate 
              ? 'Prueba seleccionando otra fecha o limpia el filtro para ver todas'
              : 'Las citas aparecerán aquí cuando los clientes te reserven'
            }
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Próximas citas */}
          {futureDates.length > 0 && (
            <section>
              <h2 className={`mb-4 flex items-center gap-2 ${ui.sectionTitle}`}>
                <span className="h-2 w-2 rounded-full bg-green-500" />
                Próximas citas
              </h2>
              <div className="space-y-4">
                {futureDates.map((dateKey) => (
                  <div key={dateKey} className="glass-card overflow-hidden rounded-2xl">
                    <div className="border-b border-white/10 bg-white/5 px-4 py-2">
                      <h3 className="font-medium capitalize text-white/90">
                        {formatDate(groupedBookings[dateKey][0].dateTime)}
                      </h3>
                    </div>
                    <div className="divide-y divide-white/10">
                      {getSortedBookings(groupedBookings[dateKey]).map((booking) => {
                          const bookingTime = new Date(booking.dateTime);
                          const isPastToday = bookingTime < now && toLocalDateString(bookingTime) === todayStr;
                          
                          return (
                            <div key={booking.id} className={`flex items-start sm:items-center justify-between px-4 py-3 gap-4 ${isPastToday ? 'bg-white/5 opacity-60' : ''}`}>
                              <div className="flex items-center gap-4">
                                <div className="text-center min-w-[60px]">
                                  <span className={`text-lg font-bold ${isPastToday ? 'text-white/45' : 'text-white/90'}`}>
                                    {formatTime(booking.dateTime)}
                                  </span>
                                  {isPastToday && (
                                    <p className="text-[10px] font-medium text-amber-400">Pasada</p>
                                  )}
                                </div>
                                <div>
                                  <p className={`font-medium ${isPastToday ? 'text-white/55' : 'text-white/90'}`}>{booking.customerName}</p>
                                  <p className="text-sm text-white/55">{booking.customerPhone}</p>
                                </div>
                              </div>
                              {!isPastToday && (
                                <button
                                  type="button"
                                  onClick={() => openCancelModal(booking)}
                                  className={`shrink-0 p-2 ${ui.btnDanger}`}
                                  aria-label={`Cancelar cita de las ${formatTime(booking.dateTime)}`}
                                  title="Cancelar cita"
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
                                    <path fillRule="evenodd" d="M16.5 4.478v.227a48.816 48.816 0 0 1 3.878.512.75.75 0 1 1-.256 1.478l-.209-.035-1.005 13.07a3 3 0 0 1-2.991 2.77H8.084a3 3 0 0 1-2.991-2.77L4.088 6.66l-.209.035a.75.75 0 1 1-.256-1.478A48.567 48.567 0 0 1 7.5 4.705v-.227c0-1.564 1.213-2.857 2.759-2.985A48.16 48.16 0 0 1 12 1.5c.587 0 1.17.01 1.741.029 1.546.128 2.759 1.42 2.759 2.985Zm-6.75 0a1.5 1.5 0 0 1 1.5-1.5h1.5a1.5 1.5 0 0 1 1.5 1.5v.053a47.81 47.81 0 0 0-4.5 0v-.053Zm-.96 5.47a.75.75 0 1 0-1.5.104l.5 7.5a.75.75 0 0 0 1.496-.1l-.5-7.5Zm6.42.104a.75.75 0 1 0-1.5-.104l-.5 7.5a.75.75 0 0 0 1.496.1l.5-7.5Z" clipRule="evenodd" />
                                  </svg>
                                </button>
                              )}
                            </div>
                          );
                        })}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Citas pasadas */}
          {pastDates.length > 0 && (
            <section>
              <h2 className={`mb-4 flex items-center gap-2 ${ui.sectionTitle} text-white/55`}>
                <span className="h-2 w-2 rounded-full bg-white/30" />
                Citas anteriores
              </h2>
              <div className="space-y-4 opacity-75">
                {pastDates.slice(0, 5).map((dateKey) => (
                  <div key={dateKey} className="glass-card overflow-hidden rounded-2xl">
                    <div className="border-b border-white/10 bg-white/5 px-4 py-2">
                      <h3 className="font-medium capitalize text-white/55">
                        {formatDate(groupedBookings[dateKey][0].dateTime)}
                      </h3>
                    </div>
                    <div className="divide-y divide-white/10">
                      {getSortedBookings(groupedBookings[dateKey]).map((booking) => (
                          <div key={booking.id} className="flex items-center px-4 py-3">
                            <div className="flex items-center gap-4">
                              <div className="text-center min-w-[60px]">
                                <span className="text-lg font-bold text-white/45">
                                  {formatTime(booking.dateTime)}
                                </span>
                              </div>
                              <div>
                                <p className="font-medium text-white/55">{booking.customerName}</p>
                                <p className="text-sm text-white/45">{booking.customerPhone}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      )}

      {cancelTarget && (
        <div className={ui.modalOverlay}>
          <div className={ui.modal}>
            <div className="mb-2 flex justify-end">
              <button
                type="button"
                onClick={closeCancelModal}
                disabled={isCancelling}
                className={`p-1 disabled:opacity-50 ${ui.btnGhost}`}
                aria-label="Cerrar modal"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-5 w-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-red-500/20 text-red-300">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6">
                <path fillRule="evenodd" d="M16.5 4.478v.227a48.816 48.816 0 0 1 3.878.512.75.75 0 1 1-.256 1.478l-.209-.035-1.005 13.07a3 3 0 0 1-2.991 2.77H8.084a3 3 0 0 1-2.991-2.77L4.088 6.66l-.209.035a.75.75 0 1 1-.256-1.478A48.567 48.567 0 0 1 7.5 4.705v-.227c0-1.564 1.213-2.857 2.759-2.985A48.16 48.16 0 0 1 12 1.5c.587 0 1.17.01 1.741.029 1.546.128 2.759 1.42 2.759 2.985Zm-6.75 0a1.5 1.5 0 0 1 1.5-1.5h1.5a1.5 1.5 0 0 1 1.5 1.5v.053a47.81 47.81 0 0 0-4.5 0v-.053Zm-.96 5.47a.75.75 0 1 0-1.5.104l.5 7.5a.75.75 0 0 0 1.496-.1l-.5-7.5Zm6.42.104a.75.75 0 1 0-1.5-.104l-.5 7.5a.75.75 0 0 0 1.496.1l.5-7.5Z" clipRule="evenodd" />
              </svg>
            </div>
            <h3 className={ui.sectionTitle}>Confirmar cancelación</h3>
            <p className="mt-2 text-sm text-white/70">
              ¿Seguro que quieres cancelar la cita de las <span className="font-semibold text-white/90">{formatTime(cancelTarget.dateTime)}</span>?
            </p>
            <p className={`mt-1 ${ui.muted}`}>
              Cliente: {cancelTarget.customerName}
            </p>
            <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={closeCancelModal}
                disabled={isCancelling}
                className={ui.btnSecondary}
              >
                No, mantener
              </button>
              <button
                type="button"
                onClick={handleConfirmCancel}
                disabled={isCancelling}
                className={ui.btnDanger}
              >
                {isCancelling ? 'Cancelando...' : 'Sí, cancelar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
