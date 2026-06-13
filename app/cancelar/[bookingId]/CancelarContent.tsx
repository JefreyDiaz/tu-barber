'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { formatColombiaDate, formatColombiaTime } from '@/lib/date-utils';

function formatBookingDate(dateStr: string): string {
  return formatColombiaDate(new Date(dateStr));
}

function formatBookingTime(dateStr: string): string {
  return formatColombiaTime(new Date(dateStr));
}

type BookingData = {
  id: string;
  customerName: string;
  barberName: string;
  dateTime: string;
  status: string;
};

interface CancelarContentProps {
  readonly bookingId: string;
}

export default function CancelarContent({ bookingId }: CancelarContentProps) {
  const [booking, setBooking] = useState<BookingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [cancelled, setCancelled] = useState(false);
  const [confirmStep, setConfirmStep] = useState(false);

  useEffect(() => {
    fetch(`/api/bookings/${bookingId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setBooking(data.data);
          if (data.data.status === 'cancelled') {
            setCancelled(true);
          }
        } else {
          setError(data.error || 'No se pudo encontrar la reserva');
        }
      })
      .catch(() => setError('Error al cargar la reserva'))
      .finally(() => setLoading(false));
  }, [bookingId]);

  const handleCancel = async () => {
    setCancelling(true);
    setError(null);
    try {
      const res = await fetch(`/api/bookings/${bookingId}`, {
        method: 'PATCH',
      });
      const data = await res.json();
      if (data.success) {
        setCancelled(true);
        setConfirmStep(false);
      } else {
        setError(data.error || 'No se pudo cancelar la reserva');
        setConfirmStep(false);
      }
    } catch {
      setError('Error de conexión. Intenta de nuevo.');
      setConfirmStep(false);
    } finally {
      setCancelling(false);
    }
  };

  // Loading
  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
        <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-gray-800" />
        <p className="mt-4 text-gray-500 text-sm">Cargando datos de tu cita...</p>
      </div>
    );
  }

  // Error (reserva no encontrada)
  if (!booking) {
    return (
      <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-8 w-8 text-red-600">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
          </svg>
        </div>
        <h2 className="text-lg font-bold text-gray-900 mb-2">Reserva no encontrada</h2>
        <p className="text-gray-500 text-sm">{error || 'El enlace puede ser incorrecto o la reserva ya no existe.'}</p>
        <Link href="/" className="inline-block mt-6 px-6 py-3 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors">
          Ir al inicio
        </Link>
      </div>
    );
  }

  // Ya cancelada
  if (cancelled) {
    return (
      <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-8 w-8 text-gray-500">
            <path strokeLinecap="round" strokeLinejoin="round" d="m9.75 9.75 4.5 4.5m0-4.5-4.5 4.5M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
          </svg>
        </div>
        <h2 className="text-lg font-bold text-gray-900 mb-2">Cita cancelada</h2>
        <p className="text-gray-500 text-sm mb-1">Tu cita ha sido cancelada exitosamente.</p>
        <p className="text-gray-400 text-xs">Puedes reservar una nueva cita cuando quieras.</p>
        <Link href="/" className="inline-block mt-6 px-6 py-3 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors">
          Reservar nueva cita
        </Link>
      </div>
    );
  }

  // Datos de la cita
  const isPast = new Date(booking.dateTime) < new Date();
  const tooLateToCancel = new Date() > new Date(new Date(booking.dateTime).getTime() - 2 * 60 * 60 * 1000);

  return (
    <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-gray-800 via-gray-900 to-black px-6 py-5 text-center">
        <h1 className="text-white text-lg font-semibold">Cancelar cita</h1>
        <p className="text-white/60 text-xs mt-1">Revisa los datos antes de cancelar</p>
      </div>

      {/* Detalles */}
      <div className="p-6 space-y-4">
        <div className="rounded-xl bg-gray-50 p-4 space-y-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-200">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-5 w-5 text-gray-600">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
              </svg>
            </div>
            <div>
              <p className="text-xs text-gray-500">Cliente</p>
              <p className="font-medium text-gray-900">{booking.customerName}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-200">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-5 w-5 text-gray-600">
                <path strokeLinecap="round" strokeLinejoin="round" d="m7.848 8.25 1.536.887M7.848 8.25a3 3 0 1 1-5.196-3 3 3 0 0 1 5.196 3Zm1.536.887a2.165 2.165 0 0 1 1.083 1.839c.005.351.054.695.14 1.024M9.384 9.137l2.077 1.199M7.848 15.75l1.536-.887m-1.536.887a3 3 0 1 1-5.196 3 3 3 0 0 1 5.196-3Zm1.536-.887a2.165 2.165 0 0 0 1.083-1.838c.005-.352.054-.695.14-1.025m-1.223 2.863 2.077-1.199m0-3.328a4.323 4.323 0 0 1 2.068-1.379l5.325-1.628a4.5 4.5 0 0 1 2.48-.044l.803.215-7.794 4.5m-2.882-1.664A4.33 4.33 0 0 0 10.607 12m3.736 0 7.794 4.5-.802.215a4.5 4.5 0 0 1-2.48-.043l-5.326-1.629a4.324 4.324 0 0 1-2.068-1.379M14.343 12l-2.882 1.664" />
              </svg>
            </div>
            <div>
              <p className="text-xs text-gray-500">Barbero</p>
              <p className="font-medium text-gray-900">{booking.barberName}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-200">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-5 w-5 text-gray-600">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
              </svg>
            </div>
            <div>
              <p className="text-xs text-gray-500">Fecha y hora</p>
              <p className="font-medium text-gray-900 capitalize">{formatBookingDate(booking.dateTime)}</p>
              <p className="text-sm text-gray-600">{formatBookingTime(booking.dateTime)}</p>
            </div>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Acciones */}
        {isPast ? (
          <div className="rounded-lg bg-gray-50 px-4 py-3 text-sm text-gray-500 text-center">
            Esta cita ya pasó y no puede ser cancelada.
          </div>
        ) : tooLateToCancel ? (
          <div className="rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-700 text-center">
            No se puede cancelar con menos de 2 horas de anticipación. Comunícate directamente con la barbería.
          </div>
        ) : confirmStep ? (
          <div className="space-y-3">
            <p className="text-sm text-gray-600 text-center font-medium">
              ¿Estás seguro de que deseas cancelar esta cita?
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setConfirmStep(false)}
                disabled={cancelling}
                className="flex-1 min-h-[48px] rounded-lg border-2 border-gray-300 px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                No, mantener
              </button>
              <button
                type="button"
                onClick={handleCancel}
                disabled={cancelling}
                className="flex-1 min-h-[48px] rounded-lg bg-red-600 px-4 py-3 text-sm font-medium text-white hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {cancelling ? 'Cancelando...' : 'Sí, cancelar'}
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setConfirmStep(true)}
            className="w-full min-h-[48px] rounded-lg bg-red-600 px-6 py-3 text-sm font-semibold text-white hover:bg-red-700 active:bg-red-800 transition-colors touch-manipulation shadow-lg"
          >
            Cancelar mi cita
          </button>
        )}

        <Link href="/" className="block text-center text-sm text-gray-500 hover:text-gray-700 transition-colors py-2">
          Volver al inicio
        </Link>
      </div>
    </div>
  );
}
