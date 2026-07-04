'use client';

import { useEffect, useState } from 'react';
import { ui } from '@/lib/admin-ui';
import { tenantApiUrl } from '@/lib/tenant/client-api';
import { useToast } from '@/components/ToastProvider';

type Service = {
  id: string;
  name: string;
  durationMinutes: number;
  sortOrder: number;
  isActive: boolean;
};

const emptyForm = { name: '', durationMinutes: 30 };

export default function AdminServicesPage() {
  const toast = useToast();
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(emptyForm);
  const [editing, setEditing] = useState<Service | null>(null);
  const [error, setError] = useState<string | null>(null);
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
    setSubmitting(true);
    try {
      const res = await fetch(tenantApiUrl('/api/admin/services'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error ?? 'Error al crear');
        return;
      }
      toast.success('Servicio creado correctamente');
      setForm(emptyForm);
      load();
    } catch {
      toast.error('Error de conexión');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault();
    if (!editing) return;
    setSubmitting(true);
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
        toast.error(json.error ?? 'Error al guardar');
        return;
      }
      toast.success('Servicio actualizado correctamente');
      setEditing(null);
      load();
    } catch {
      toast.error('Error de conexión');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('¿Eliminar este servicio?')) return;
    const res = await fetch(tenantApiUrl(`/api/admin/services/${id}`), { method: 'DELETE' });
    if (res.ok) {
      toast.success('Servicio eliminado correctamente');
      load();
    } else {
      const json = await res.json().catch(() => ({}));
      toast.error(json.error ?? 'Error al eliminar');
    }
  }

  return (
    <div className={ui.pageWide}>
      <div>
        <h1 className={ui.title}>Tipos de corte</h1>
        <p className={ui.subtitle}>
          Define los servicios y cuánto dura cada uno. El sistema usa esos tiempos para calcular
          los espacios disponibles y reducir huecos muertos en la agenda.
        </p>
      </div>

      {error && (
        <div className={ui.alertError}>{error}</div>
      )}

      <form onSubmit={handleCreate} className={ui.card}>
        <h2 className={`mb-4 ${ui.sectionTitle}`}>Agregar servicio</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="svc-name" className={ui.label}>
              Nombre *
            </label>
            <input
              id="svc-name"
              required
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="Ej. Corte completo"
              className={ui.input}
            />
          </div>
          <div>
            <label htmlFor="svc-duration" className={ui.label}>
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
              className={ui.input}
            />
          </div>
        </div>
        <button
          type="submit"
          disabled={submitting}
          className={`mt-4 ${ui.btnPrimary}`}
        >
          {submitting ? 'Guardando...' : 'Agregar'}
        </button>
      </form>

      <section>
        <h2 className={`mb-4 ${ui.sectionTitle}`}>Servicios activos</h2>
        {loading ? (
          <p className={ui.muted}>Cargando...</p>
        ) : services.length === 0 ? (
          <p className={`${ui.empty} text-white/50`}>
            No hay servicios. Agrega al menos uno para que los clientes puedan reservar.
          </p>
        ) : (
          <div className="space-y-3">
            {services.map((s) => (
              <div
                key={s.id}
                className={`flex flex-wrap items-center justify-between gap-3 ${ui.listItem}`}
              >
                {editing?.id === s.id ? (
                  <form onSubmit={handleUpdate} className="flex flex-1 flex-wrap items-end gap-3">
                    <input
                      value={editing.name}
                      onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                      className={ui.input}
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
                      className={`w-24 ${ui.input}`}
                    />
                    <label className="flex items-center gap-2 text-sm text-white/75">
                      <input
                        type="checkbox"
                        checked={editing.isActive}
                        onChange={(e) => setEditing({ ...editing, isActive: e.target.checked })}
                      />
                      Activo
                    </label>
                    <button type="submit" className={ui.btnPrimary}>
                      Guardar
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditing(null)}
                      className={ui.btnSecondary}
                    >
                      Cancelar
                    </button>
                  </form>
                ) : (
                  <>
                    <div>
                      <p className="font-medium text-white/90">{s.name}</p>
                      <p className="text-sm text-white/55">
                        {s.durationMinutes} min · {s.isActive ? 'Activo' : 'Inactivo'}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setEditing(s)}
                        className={ui.btnGhost}
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(s.id)}
                        className={ui.btnDanger}
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
