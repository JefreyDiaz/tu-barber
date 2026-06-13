'use client';

import { useEffect, useState } from 'react';
import { COLOMBIA_TZ } from '@/lib/date-utils';

type Booking = {
  id: string;
  customerName: string;
  customerPhone: string;
  dateTime: string;
  status: string;
  barber: {
    id: string;
    name: string;
  };
  createdAt: string;
};

const toLocalDateString = (date: Date) => {
  const y = date.toLocaleString('en-CA', { timeZone: COLOMBIA_TZ, year: 'numeric' });
  const m = date.toLocaleString('en-CA', { timeZone: COLOMBIA_TZ, month: '2-digit' });
  const d = date.toLocaleString('en-CA', { timeZone: COLOMBIA_TZ, day: '2-digit' });
  return `${y}-${m}-${d}`;
};

const getTodayString = () => toLocalDateString(new Date());

export default function AdminBookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterDate, setFilterDate] = useState<string>(getTodayString());
  const [cancelTarget, setCancelTarget] = useState<Booking | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/bookings')
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
    setActionError(null);
    setCancelTarget(booking);
  };

  const closeCancelModal = () => {
    if (isCancelling) return;
    setCancelTarget(null);
  };

  const handleConfirmCancel = async () => {
    if (!cancelTarget) return;

    setIsCancelling(true);
    setActionError(null);
    setActionSuccess(null);

    try {
      const response = await fetch(`/api/bookings/${cancelTarget.id}`, {
        method: 'PATCH',
      });
      const data = await response.json();

      if (!response.ok || !data.success) {
        setActionError(data.error || 'No se pudo cancelar la reserva');
        return;
      }

      setBookings((prev) => prev.filter((booking) => booking.id !== cancelTarget.id));
      setActionSuccess(`Cita de las ${formatTime(cancelTarget.dateTime)} cancelada correctamente.`);
      setCancelTarget(null);
    } catch {
      setActionError('Error de conexión. Intenta de nuevo.');
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
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-neutral-800">Reservas</h1>
        <p className="text-neutral-500 mt-1">Gestiona todas las citas de la barbería</p>
      </div>

      {/* Filtro de fecha */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <label htmlFor="filterDate" className="text-sm font-medium text-neutral-600">
            Filtrar por fecha:
          </label>
          <input
            type="date"
            id="filterDate"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
            className="rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none focus:ring-1 focus:ring-neutral-500"
          />
        </div>
        {filterDate && (
          <button
            type="button"
            onClick={() => setFilterDate('')}
            className="flex items-center gap-1.5 rounded-lg bg-neutral-100 px-3 py-2 text-sm font-medium text-neutral-600 hover:bg-neutral-200 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-4 w-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
            Limpiar filtro
          </button>
        )}
        {filterDate && (
          <span className="text-sm text-neutral-500">
            Mostrando {filteredBookings.length} {filteredBookings.length === 1 ? 'reserva' : 'reservas'}
          </span>
        )}
      </div>

      {actionSuccess && (
        <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          {actionSuccess}
        </div>
      )}
      {actionError && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {actionError}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-neutral-300 border-t-neutral-800" />
        </div>
      ) : filteredBookings.length === 0 ? (
        <div className="rounded-xl border border-neutral-200 bg-white p-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-neutral-100">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="h-8 w-8 text-neutral-400"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5"
              />
            </svg>
          </div>
          <p className="text-neutral-600">
            {filterDate ? 'No hay reservas para esta fecha' : 'No hay reservas programadas'}
          </p>
          <p className="text-sm text-neutral-400 mt-1">
            {filterDate 
              ? 'Prueba seleccionando otra fecha o limpia el filtro para ver todas'
              : 'Las citas aparecerán aquí cuando los clientes reserven'
            }
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Próximas citas */}
          {futureDates.length > 0 && (
            <section>
              <h2 className="mb-4 text-lg font-semibold text-neutral-700 flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-green-500" />
                Próximas citas
              </h2>
              <div className="space-y-4">
                {futureDates.map((dateKey) => (
                  <div key={dateKey} className="rounded-xl border border-neutral-200 bg-white overflow-hidden">
                    <div className="bg-neutral-50 px-4 py-2 border-b border-neutral-200">
                      <h3 className="font-medium text-neutral-700 capitalize">
                        {formatDate(groupedBookings[dateKey][0].dateTime)}
                      </h3>
                    </div>
                    <div className="divide-y divide-neutral-100">
                      {getSortedBookings(groupedBookings[dateKey]).map((booking) => {
                          const bookingTime = new Date(booking.dateTime);
                          const isPastToday = bookingTime < now && toLocalDateString(bookingTime) === todayStr;
                          
                          return (
                            <div key={booking.id} className={`flex items-start sm:items-center justify-between px-4 py-3 gap-4 ${isPastToday ? 'opacity-60 bg-neutral-50' : ''}`}>
                              <div className="flex items-center gap-4 min-w-0 flex-1">
                                <div className="text-center min-w-[60px] shrink-0">
                                  <span className={`text-lg font-bold ${isPastToday ? 'text-neutral-500' : 'text-neutral-800'}`}>
                                    {formatTime(booking.dateTime)}
                                  </span>
                                  {isPastToday && (
                                    <p className="text-[10px] text-orange-600 font-medium">Pasada</p>
                                  )}
                                </div>
                                <div className="min-w-0 flex-1">
                                  <p className={`font-medium truncate ${isPastToday ? 'text-neutral-600' : 'text-neutral-800'}`}>{booking.customerName}</p>
                                  <p className="text-sm text-neutral-500 truncate">{booking.customerPhone}</p>
                                  <p className={`text-xs sm:hidden ${isPastToday ? 'text-neutral-400' : 'text-neutral-500'}`}>{booking.barber.name}</p>
                                </div>
                                <div className="hidden sm:block text-right shrink-0">
                                  <p className="text-xs text-neutral-400">Barbero</p>
                                  <p className={`text-sm font-medium ${isPastToday ? 'text-neutral-500' : 'text-neutral-700'}`}>{booking.barber.name}</p>
                                </div>
                              </div>
                              {!isPastToday && (
                                <button
                                  type="button"
                                  onClick={() => openCancelModal(booking)}
                                  className="shrink-0 rounded-lg border border-red-200 p-2 text-red-600 transition-colors hover:bg-red-50 hover:text-red-700 focus:outline-none focus:ring-2 focus:ring-red-300"
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
              <h2 className="mb-4 text-lg font-semibold text-neutral-500 flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-neutral-400" />
                Citas anteriores
              </h2>
              <div className="space-y-4 opacity-75">
                {pastDates.slice(0, 10).map((dateKey) => (
                  <div key={dateKey} className="rounded-xl border border-neutral-200 bg-white overflow-hidden">
                    <div className="bg-neutral-50 px-4 py-2 border-b border-neutral-200">
                      <h3 className="font-medium text-neutral-500 capitalize">
                        {formatDate(groupedBookings[dateKey][0].dateTime)}
                      </h3>
                    </div>
                    <div className="divide-y divide-neutral-100">
                      {getSortedBookings(groupedBookings[dateKey]).map((booking) => (
                          <div key={booking.id} className="flex items-center px-4 py-3 gap-4">
                            <div className="flex items-center gap-4 min-w-0 flex-1">
                              <div className="text-center min-w-[60px] shrink-0">
                                <span className="text-lg font-bold text-neutral-500">
                                  {formatTime(booking.dateTime)}
                                </span>
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="font-medium text-neutral-600 truncate">{booking.customerName}</p>
                                <p className="text-sm text-neutral-400 truncate">{booking.customerPhone}</p>
                                <p className="text-xs text-neutral-400 sm:hidden">{booking.barber.name}</p>
                              </div>
                              <div className="hidden sm:block text-right shrink-0">
                                <p className="text-xs text-neutral-400">Barbero</p>
                                <p className="text-sm font-medium text-neutral-500">{booking.barber.name}</p>
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
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4 sm:items-center">
          <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl">
            <div className="mb-2 flex justify-end">
              <button
                type="button"
                onClick={closeCancelModal}
                disabled={isCancelling}
                className="rounded-md p-1 text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-700 disabled:opacity-50"
                aria-label="Cerrar modal"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-5 w-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-red-100 text-red-600">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6">
                <path fillRule="evenodd" d="M16.5 4.478v.227a48.816 48.816 0 0 1 3.878.512.75.75 0 1 1-.256 1.478l-.209-.035-1.005 13.07a3 3 0 0 1-2.991 2.77H8.084a3 3 0 0 1-2.991-2.77L4.088 6.66l-.209.035a.75.75 0 1 1-.256-1.478A48.567 48.567 0 0 1 7.5 4.705v-.227c0-1.564 1.213-2.857 2.759-2.985A48.16 48.16 0 0 1 12 1.5c.587 0 1.17.01 1.741.029 1.546.128 2.759 1.42 2.759 2.985Zm-6.75 0a1.5 1.5 0 0 1 1.5-1.5h1.5a1.5 1.5 0 0 1 1.5 1.5v.053a47.81 47.81 0 0 0-4.5 0v-.053Zm-.96 5.47a.75.75 0 1 0-1.5.104l.5 7.5a.75.75 0 0 0 1.496-.1l-.5-7.5Zm6.42.104a.75.75 0 1 0-1.5-.104l-.5 7.5a.75.75 0 0 0 1.496.1l.5-7.5Z" clipRule="evenodd" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-neutral-900">Confirmar cancelación</h3>
            <p className="mt-2 text-sm text-neutral-600">
              ¿Seguro que quieres cancelar la cita de las <span className="font-semibold text-neutral-800">{formatTime(cancelTarget.dateTime)}</span>?
            </p>
            <p className="mt-1 text-sm text-neutral-500">
              Cliente: {cancelTarget.customerName}
            </p>
            <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={closeCancelModal}
                disabled={isCancelling}
                className="rounded-lg border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-60"
              >
                No, mantener
              </button>
              <button
                type="button"
                onClick={handleConfirmCancel}
                disabled={isCancelling}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
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
