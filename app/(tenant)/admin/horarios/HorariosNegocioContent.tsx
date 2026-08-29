'use client';

import { useEffect, useState } from 'react';
import ScheduleEditor, { type ScheduleConfig } from '@/components/ScheduleEditor';
import { ui } from '@/lib/admin-ui';
import { DEFAULT_SCHEDULE } from '@/lib/tenant/defaults';
import { normalizeScheduleConfig } from '@/lib/schedule';
import { tenantApiUrl } from '@/lib/tenant/client-api';
import { useToast } from '@/components/ToastProvider';

export default function HorariosNegocioContent() {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [schedule, setSchedule] = useState<ScheduleConfig>(DEFAULT_SCHEDULE);

  useEffect(() => {
    fetch(tenantApiUrl('/api/admin/settings'))
      .then((r) => r.json())
      .then((json) => {
        if (json.success && json.data?.scheduleJson) {
          setSchedule(normalizeScheduleConfig(json.data.scheduleJson as ScheduleConfig));
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  async function handleSaveSchedule(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const res = await fetch(tenantApiUrl('/api/admin/settings'), {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scheduleJson: schedule }),
    });
    const json = await res.json();
    setSaving(false);
    if (json.success) toast.success('Horarios guardados correctamente');
    else toast.error(json.error ?? 'Error al guardar horarios');
  }

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <div className={ui.spinner} />
      </div>
    );
  }

  return (
    <div className={ui.pageWide}>
      <div>
        <h1 className={ui.title}>Horarios</h1>
        <p className={ui.subtitle}>
          Horario de atención de la barbería para reservas y bloqueos
        </p>
      </div>
      <section className={ui.card}>
        <p className={`mb-4 ${ui.muted}`}>
          Los turnos en reservas y bloqueos usan el intervalo del servicio más corto activo.
        </p>
        <form onSubmit={handleSaveSchedule}>
          <ScheduleEditor value={schedule} onChange={setSchedule} />
          <button type="submit" disabled={saving} className={`mt-4 ${ui.btnPrimary}`}>
            {saving ? 'Guardando...' : 'Guardar horarios'}
          </button>
        </form>
      </section>
    </div>
  );
}
