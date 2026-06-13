'use client';

import { useState, useEffect } from 'react';
import { DayPicker } from 'react-day-picker';
import 'react-day-picker/dist/style.css';
import { z } from 'zod';
const month_names = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

const bookingFormSchema = z.object({
  customerName: z
    .string()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(50, 'El nombre no puede exceder 50 caracteres')
    .trim(),
  customerPhone: z
    .string()
    .regex(/^\+?[\d\s-]+$/, 'Formato de teléfono inválido')
    .min(1, 'Teléfono requerido'),
});

interface BookingFormProps {
  readonly barberId: string;
  readonly barberName: string;
}

export default function BookingForm({ barberId, barberName }: BookingFormProps) {
  const [displayMonth, setDisplayMonth] = useState<Date>(() => {
    const d = new Date();
    d.setDate(1);
    return d;
  });
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    customerName: '',
    customerPhone: '',
  });

  // Cargar horarios disponibles cuando se selecciona una fecha
  useEffect(() => {
    if (selectedDate) {
      setLoading(true);
      const dateStr = selectedDate.toISOString().split('T')[0];
      
      fetch(`/api/bookings/available?barberId=${barberId}&date=${dateStr}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            setAvailableSlots(data.data);
            setSelectedTime(''); // Resetear hora seleccionada
          }
        })
        .catch((error) => {
          console.error('Error loading available slots:', error);
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setAvailableSlots([]);
      setSelectedTime('');
    }
  }, [selectedDate, barberId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setSuccess(false);

    // Validar fecha y hora seleccionadas
    if (!selectedDate || !selectedTime) {
      setErrors({ general: 'Por favor selecciona una fecha y hora' });
      return;
    }

    // Validar formulario con Zod
    const result = bookingFormSchema.safeParse(formData);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.issues.forEach((err) => {
        if (err.path[0]) {
          fieldErrors[err.path[0].toString()] = err.message;
        }
      });
      setErrors(fieldErrors);
      return;
    }

    setSubmitting(true);

    try {
      const dateStr = selectedDate.toISOString().split('T')[0];
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          barberId,
          customerName: result.data.customerName,
          customerPhone: result.data.customerPhone,
          date: dateStr,
          time: selectedTime,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(true);
        // Resetear formulario
        setFormData({ customerName: '', customerPhone: '' });
        setSelectedDate(undefined);
        setSelectedTime('');
        setAvailableSlots([]);
      } else {
        setErrors({ general: data.error || 'Error al crear la reserva' });
      }
    } catch (error) {
      console.error('Error submitting booking:', error);
      setErrors({ general: 'Error al crear la reserva. Por favor intenta de nuevo.' });
    } finally {
      setSubmitting(false);
    }
  };

  const disabledDays = [
    { dayOfWeek: [0] }, // Domingo
  ];

  const minDate = new Date();
  minDate.setDate(minDate.getDate() + 1); // Mañana como mínimo

  const maxDate = new Date();
  maxDate.setDate(maxDate.getDate() + 30); // 30 días máximo

  if (success) {
    return (
      <div className="bg-white rounded-lg shadow-xl p-8 text-center">
        <div className="mb-4">
          <svg
            className="mx-auto h-16 w-16 text-green-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          ¡Reserva confirmada!
        </h2>
        <p className="text-gray-600 mb-6">
          Tu reserva con {barberName} ha sido creada exitosamente.
        </p>
        <a
          href="/"
          className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Volver al inicio
        </a>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-xl p-6 md:p-8">
      {/* Calendario */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Selecciona una fecha
        </h2>
        <div className="flex justify-center">
          {/* Container relative so header can overlay the calendar */}
          <div className="relative w-full max-w-md">
            {/* Header banner positioned over the calendar */}
            <div className="absolute -top-6 left-4 right-4">
              <div className="calendar-header flex justify-between items-center bg-[#8089FE] text-white rounded-md px-3 py-2 shadow-md">
                <span className="month-picker px-4 py-2 rounded-md bg-transparent text-white text-sm font-semibold">
                  {month_names[displayMonth.getMonth()]}
                </span>
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() =>
                      setDisplayMonth(
                        new Date(displayMonth.getFullYear(), displayMonth.getMonth() - 1, 1)
                      )
                    }
                    className="h-8 w-8 bg-white text-gray-800 border border-gray-200 rounded-md flex items-center justify-center hover:bg-blue-50 transition"
                  >
                    &lt;
                  </button>
                  <span className="text-base font-semibold text-white">
                    {displayMonth.getFullYear()}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      setDisplayMonth(
                        new Date(displayMonth.getFullYear(), displayMonth.getMonth() + 1, 1)
                      )
                    }
                    className="h-8 w-8 bg-white text-gray-800 border border-gray-200 rounded-md flex items-center justify-center hover:bg-blue-50 transition"
                  >
                    &gt;
                  </button>
                </div>
              </div>
            </div>
            <div className="pt-12">
              <DayPicker
            mode="single"
            month={displayMonth}
            selected={selectedDate}
            onSelect={setSelectedDate}
            disabled={[
              ...disabledDays,
              { before: minDate },
              { after: maxDate },
            ]}
            modifiersClassNames={{
              disabled: 'day_disabled',
            }}
            className="rounded-xl bg-white shadow-sm border border-gray-200 p-4"
            classNames={{
              months: 'flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0',
              month: 'space-y-4',
              caption: 'hidden', // hide built-in caption since we render a custom header
              caption_label: 'text-base font-semibold text-gray-900',
              nav: 'hidden',
              nav_button: 'h-8 w-8 bg-white text-gray-800 border border-gray-200 rounded-md flex items-center justify-center hover:bg-blue-50 transition',
              nav_button_previous: 'absolute left-2',
              nav_button_next: 'absolute right-2',
              table: 'w-full border-collapse space-y-1',
              head_row: 'flex',
              head_cell: 'text-gray-600 rounded-md w-9 font-medium text-[0.8rem]',
              row: 'flex w-full mt-2',
              cell: 'text-center text-sm p-0 relative [&:has([aria-selected])]:bg-blue-50 first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20',
              day: 'h-9 w-9 p-0 font-normal text-gray-800 aria-selected:opacity-100 hover:bg-blue-100 rounded-md',
              day_selected: 'bg-blue-600 text-white hover:bg-blue-600 hover:text-white focus:bg-blue-600 focus:text-white',
              day_today: 'ring-1 ring-blue-200 text-blue-900 font-semibold bg-blue-50',
              day_outside: 'text-gray-300 opacity-40',
              day_disabled: 'text-gray-300 opacity-40',
              day_range_middle: 'aria-selected:bg-blue-50 aria-selected:text-blue-900',
              day_hidden: 'invisible',
            }}
          />
        </div>
          </div>
        </div>
      </div>

      {/* Selector de hora */}
      {selectedDate && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Selecciona una hora
          </h2>
          {loading ? (
            <div className="text-center py-4 text-gray-500">Cargando horarios...</div>
          ) : (
            <>
              {availableSlots.length === 0 ? (
                <div className="text-center py-4 text-gray-500">
                  No hay horarios disponibles para esta fecha
                </div>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
                  {availableSlots.map((slot) => (
                    <button
                      key={slot}
                      type="button"
                      onClick={() => setSelectedTime(slot)}
                      className={`px-4 py-2 rounded-lg border-2 transition-colors ${
                        selectedTime === slot
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-white text-gray-700 border-gray-300 hover:border-blue-400'
                      }`}
                    >
                      {slot}
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Formulario de datos */}
      <div className="space-y-6">
        <h2 className="text-xl font-semibold text-gray-900">Datos de contacto</h2>

        <div>
          <label htmlFor="customerName" className="block text-sm font-medium text-gray-700 mb-2">
            Nombre completo *
          </label>
          <input
            type="text"
            id="customerName"
            value={formData.customerName}
            onChange={(e) =>
              setFormData({ ...formData, customerName: e.target.value })
            }
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-400"
            placeholder="Tu nombre"
          />
          {errors.customerName && (
            <p className="mt-1 text-sm text-red-600">{errors.customerName}</p>
          )}
        </div>

        <div>
          <label htmlFor="customerPhone" className="block text-sm font-medium text-gray-700 mb-2">
            Teléfono (WhatsApp) *
          </label>
          <input
            type="tel"
            id="customerPhone"
            value={formData.customerPhone}
            onChange={(e) =>
              setFormData({ ...formData, customerPhone: e.target.value })
            }
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-400"
            placeholder="+1234567890"
          />
          {errors.customerPhone && (
            <p className="mt-1 text-sm text-red-600">{errors.customerPhone}</p>
          )}
        </div>

        {errors.general && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {errors.general}
          </div>
        )}

        <button
          type="submit"
          disabled={submitting || !selectedDate || !selectedTime}
          className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {submitting ? 'Reservando...' : 'Confirmar reserva'}
        </button>
      </div>
    </form>
  );
}
