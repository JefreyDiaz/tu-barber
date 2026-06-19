'use client';

import { useEffect, useState } from 'react';
import { tenantApiUrl } from '@/lib/tenant/client-api';

type Service = {
  id: string;
  name: string;
  durationMinutes: number;
  sortOrder: number;
  isActive: boolean;
};

const emptyForm = { name: '', durationMinutes: 30 };

export default function AdminServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(emptyForm);
  const [editing, setEditing] = useState<Service | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function load() {
    setLoading(true);
    setError(null);
    fetch(tenantApiUrl('/api/admin/services'))
      .then(async (r) => {
        if (!r.ok) {
          let message = `Error ${r.status}`;
          try {
            const body = await r.json();
            message = body.error ?? message;
          } catch {
            /* empty body */
          }
          throw new Error(message);
        }
        return r.json();
      })
      .then((json) => {
        if (json.success) setServices(json.data ?? []);
        else setError(json.error ?? 'Error al cargar servicios');
      })
      .catch((err: Error) => {
        setError(
          err.message ||
            'No se pudieron cargar los servicios. Ejecuta: npx prisma migrate deploy && npm run db:seed-services'
        );
      })
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setSubmitting(true);
    try {
      const res = await fetch(tenantApiUrl('/api/admin/services'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? 'Error al crear');
        return;
      }
      setSuccess('Servicio creado');
      setForm(emptyForm);
      load();
    } catch {
      setError('Error de conexión');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault();
    if (!editing) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(tenantApiUrl(`/api/admin/services/${editing.id}`), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editing.name,
          durationMinutes: editing.durationMinutes,
          isActive: editing.isActive,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? 'Error al guardar');
        return;
      }
      setSuccess('Servicio actualizado');
      setEditing(null);
      load();
    } catch {
      setError('Error de conexión');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('¿Eliminar este servicio?')) return;
    const res = await fetch(tenantApiUrl(`/api/admin/services/${id}`), { method: 'DELETE' });
    if (res.ok) {
      setSuccess('Servicio eliminado');
      load();
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-neutral-800">Tipos de corte</h1>
        <p className="mt-1 text-sm text-neutral-600">
          Define los servicios y cuánto dura cada uno. El sistema usa esos tiempos para calcular
          los espacios disponibles y reducir huecos muertos en la agenda.
        </p>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">{error}</div>
      )}
      {success && (
        <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-2 text-sm text-green-700">{success}</div>
      )}

      <form onSubmit={handleCreate} className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-neutral-800">Agregar servicio</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="svc-name" className="mb-1 block text-sm font-medium text-neutral-700">
              Nombre *
            </label>
            <input
              id="svc-name"
              required
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="Ej. Corte completo"
              className="w-full rounded-lg border border-neutral-300 px-3 py-2"
            />
          </div>
          <div>
            <label htmlFor="svc-duration" className="mb-1 block text-sm font-medium text-neutral-700">
              Duración (minutos) *
            </label>
            <input
              id="svc-duration"
              type="number"
              required
              min={5}
              max={240}
              value={form.durationMinutes}
              onChange={(e) => setForm((f) => ({ ...f, durationMinutes: Number(e.target.value) }))}
              className="w-full rounded-lg border border-neutral-300 px-3 py-2"
            />
          </div>
        </div>
        <button
          type="submit"
          disabled={submitting}
          className="mt-4 rounded-lg bg-neutral-800 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700 disabled:opacity-50"
        >
          {submitting ? 'Guardando...' : 'Agregar'}
        </button>
      </form>

      <section>
        <h2 className="mb-4 text-lg font-semibold text-neutral-800">Servicios activos</h2>
        {loading ? (
          <p className="text-neutral-500">Cargando...</p>
        ) : services.length === 0 ? (
          <p className="rounded-lg border border-neutral-200 bg-white p-4 text-neutral-500">
            No hay servicios. Agrega al menos uno para que los clientes puedan reservar.
          </p>
        ) : (
          <div className="space-y-3">
            {services.map((s) => (
              <div
                key={s.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-neutral-200 bg-white p-4"
              >
                {editing?.id === s.id ? (
                  <form onSubmit={handleUpdate} className="flex flex-1 flex-wrap items-end gap-3">
                    <input
                      value={editing.name}
                      onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                      className="rounded-lg border border-neutral-300 px-3 py-2"
                      required
                    />
                    <input
                      type="number"
                      min={5}
                      max={240}
                      value={editing.durationMinutes}
                      onChange={(e) =>
                        setEditing({ ...editing, durationMinutes: Number(e.target.value) })
                      }
                      className="w-24 rounded-lg border border-neutral-300 px-3 py-2"
                    />
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={editing.isActive}
                        onChange={(e) => setEditing({ ...editing, isActive: e.target.checked })}
                      />
                      Activo
                    </label>
                    <button type="submit" className="rounded-lg bg-neutral-800 px-3 py-2 text-sm text-white">
                      Guardar
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditing(null)}
                      className="rounded-lg border px-3 py-2 text-sm"
                    >
                      Cancelar
                    </button>
                  </form>
                ) : (
                  <>
                    <div>
                      <p className="font-medium text-neutral-900">{s.name}</p>
                      <p className="text-sm text-neutral-500">
                        {s.durationMinutes} min · {s.isActive ? 'Activo' : 'Inactivo'}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setEditing(s)}
                        className="rounded-lg border border-neutral-300 px-3 py-1.5 text-sm hover:bg-neutral-50"
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(s.id)}
                        className="rounded-lg border border-red-200 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50"
                      >
                        Eliminar
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
