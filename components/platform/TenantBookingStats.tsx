'use client';

import { useEffect, useMemo, useState } from 'react';

type StatsPreset = 'this_month' | 'last_month' | 'today' | 'yesterday' | 'day' | 'range';

type StatsData = {
  count: number;
  totalAllTime: number;
  label: string;
};

const PRESET_OPTIONS: { id: StatsPreset; label: string }[] = [
  { id: 'this_month', label: 'Este mes' },
  { id: 'last_month', label: 'Mes pasado' },
  { id: 'today', label: 'Hoy' },
  { id: 'yesterday', label: 'Ayer' },
  { id: 'day', label: 'Día específico' },
  { id: 'range', label: 'Rango de fechas' },
];

function todayDateInputValue(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

export default function TenantBookingStats({
  tenantId,
  active,
}: {
  tenantId: string;
  active: boolean;
}) {
  const [preset, setPreset] = useState<StatsPreset>('this_month');
  const [day, setDay] = useState(todayDateInputValue);
  const [from, setFrom] = useState(todayDateInputValue);
  const [to, setTo] = useState(todayDateInputValue);
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const query = useMemo(() => {
    const params = new URLSearchParams({ preset });
    if (preset === 'day') params.set('date', day);
    if (preset === 'range') {
      params.set('from', from);
      params.set('to', to);
    }
    return params.toString();
  }, [preset, day, from, to]);

  useEffect(() => {
    if (!active) return;

    let cancelled = false;
    setLoading(true);
    setError(null);

    void fetch(`/api/platform/tenants/${tenantId}/bookings-stats?${query}`)
      .then(async (res) => {
        const json = (await res.json()) as {
          success?: boolean;
          data?: StatsData;
          error?: string;
        };
        if (cancelled) return;
        if (!res.ok || !json.success || !json.data) {
          setError(json.error ?? 'No se pudo cargar el recuento');
          setStats(null);
          return;
        }
        setStats(json.data);
      })
      .catch(() => {
        if (!cancelled) {
          setError('Error de conexión');
          setStats(null);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [active, tenantId, query]);

  return (
    <div className="h-full rounded-xl border border-white/10 bg-white/[0.03] p-4">
      <p className="text-xs font-medium uppercase tracking-wider text-white/40">Reservas</p>

      <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="min-w-0 flex-1">
          <label htmlFor={`booking-preset-${tenantId}`} className="mb-1 block text-xs text-white/50">
            Periodo
          </label>
          <select
            id={`booking-preset-${tenantId}`}
            value={preset}
            onChange={(e) => setPreset(e.target.value as StatsPreset)}
            className="w-full rounded-xl border border-white/12 bg-white/6 px-3 py-2.5 text-sm text-white"
          >
            {PRESET_OPTIONS.map((opt) => (
              <option key={opt.id} value={opt.id} className="bg-stone-900">
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {preset === 'day' && (
          <div className="min-w-0 flex-1">
            <label htmlFor={`booking-day-${tenantId}`} className="mb-1 block text-xs text-white/50">
              Fecha
            </label>
            <input
              id={`booking-day-${tenantId}`}
              type="date"
              value={day}
              onChange={(e) => setDay(e.target.value)}
              className="glass-input w-full px-3 py-2.5 text-sm"
            />
          </div>
        )}

        {preset === 'range' && (
          <>
            <div className="min-w-0 flex-1">
              <label htmlFor={`booking-from-${tenantId}`} className="mb-1 block text-xs text-white/50">
                Desde
              </label>
              <input
                id={`booking-from-${tenantId}`}
                type="date"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                className="glass-input w-full px-3 py-2.5 text-sm"
              />
            </div>
            <div className="min-w-0 flex-1">
              <label htmlFor={`booking-to-${tenantId}`} className="mb-1 block text-xs text-white/50">
                Hasta
              </label>
              <input
                id={`booking-to-${tenantId}`}
                type="date"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                className="glass-input w-full px-3 py-2.5 text-sm"
              />
            </div>
          </>
        )}
      </div>

      <div className="mt-4 flex flex-wrap items-baseline gap-x-3 gap-y-1">
        {loading && <p className="text-sm text-white/45">Calculando…</p>}
        {!loading && error && <p className="text-sm text-red-300">{error}</p>}
        {!loading && !error && stats && (
          <>
            <p className="text-3xl font-bold text-gradient-gold">{stats.count}</p>
            <p className="text-sm text-white/60">
              {stats.count === 1 ? 'reserva' : 'reservas'} · {stats.label}
            </p>
            <p className="w-full text-xs text-white/40">
              Total histórico (sin canceladas): {stats.totalAllTime}
            </p>
          </>
        )}
      </div>
    </div>
  );
}
