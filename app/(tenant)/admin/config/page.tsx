'use client';

import { useEffect, useState } from 'react';
import ScheduleEditor, { type ScheduleConfig } from '@/components/ScheduleEditor';
import { ui } from '@/lib/admin-ui';
import { DEFAULT_SCHEDULE } from '@/lib/tenant/defaults';
import { tenantApiUrl } from '@/lib/tenant/client-api';

export default function AdminConfigPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [tenantId, setTenantId] = useState('');
  const [schedule, setSchedule] = useState<ScheduleConfig>(DEFAULT_SCHEDULE);
  const [form, setForm] = useState({
    manychatApiKey: '',
    manychatFlowBooking: '',
    manychatFlowBarber: '',
    manychatFlowReminder: '',
    customDomain: '',
    plan: 'basic',
    effectivePlan: 'basic',
    subscriptionStatus: 'none',
    trialDaysLeft: null as number | null,
    domainVerified: false,
    domainVerification: [] as Array<{ type: string; domain: string; value: string }>,
  });

  useEffect(() => {
    fetch(tenantApiUrl('/api/admin/settings'))
      .then((r) => r.json())
      .then((json) => {
        if (json.success && json.data) {
          setTenantId(json.data.tenantId ?? '');
          setForm((f) => ({
            ...f,
            manychatApiKey: json.data.manychatApiKey ?? '',
            manychatFlowBooking: json.data.manychatFlowBooking ?? '',
            manychatFlowBarber: json.data.manychatFlowBarber ?? '',
            manychatFlowReminder: json.data.manychatFlowReminder ?? '',
            customDomain: json.data.customDomain ?? '',
            plan: json.data.plan ?? 'basic',
            effectivePlan: json.data.effectivePlan ?? json.data.plan ?? 'basic',
            subscriptionStatus: json.data.subscriptionStatus ?? 'none',
            trialDaysLeft: json.data.trialDaysLeft ?? null,
            domainVerified: json.data.domainVerified ?? false,
          }));
          if (json.data.scheduleJson) {
            setSchedule(json.data.scheduleJson as ScheduleConfig);
          }
        }
        setLoading(false);
      });
  }, []);

  async function handleSaveManyChat(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    const res = await fetch(tenantApiUrl('/api/admin/settings'), {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        manychatApiKey: form.manychatApiKey || undefined,
        manychatFlowBooking: form.manychatFlowBooking || undefined,
        manychatFlowBarber: form.manychatFlowBarber || undefined,
        manychatFlowReminder: form.manychatFlowReminder || undefined,
      }),
    });
    const json = await res.json();
    setSaving(false);
    setMessage(json.success ? 'ManyChat guardado' : json.error ?? 'Error al guardar');
  }

  async function handleSaveSchedule(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    const res = await fetch(tenantApiUrl('/api/admin/settings'), {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scheduleJson: schedule }),
    });
    const json = await res.json();
    setSaving(false);
    setMessage(json.success ? 'Horarios guardados' : json.error ?? 'Error al guardar horarios');
  }

  async function saveCustomDomain() {
    if (!form.customDomain || !tenantId) return;
    setSaving(true);
    const res = await fetch(`/api/platform/tenants/${tenantId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ customDomain: form.customDomain }),
    });
    const json = await res.json();
    setSaving(false);
    if (json.success) {
      setForm((f) => ({
        ...f,
        domainVerified: json.data?.domainVerified ?? false,
        domainVerification: json.verification ?? [],
      }));
      setMessage(json.hint ?? 'Dominio registrado');
    } else {
      setMessage(json.error ?? 'Error');
    }
  }

  async function checkDomainStatus() {
    if (!tenantId) return;
    const res = await fetch(`/api/platform/tenants/${tenantId}/domain`);
    const json = await res.json();
    if (json.success) {
      setForm((f) => ({
        ...f,
        domainVerified: json.data.verified,
        domainVerification: json.verification ?? [],
      }));
      setMessage(json.data.verified ? 'Dominio verificado' : 'Pendiente de verificación DNS');
    }
  }

  if (loading) return <p className={ui.muted}>Cargando...</p>;

  return (
    <div className={ui.pageWide}>
      <div>
        <h1 className={ui.title}>Configuración</h1>
        <p className={ui.subtitle}>Horarios, ManyChat y dominio personalizado</p>
      </div>
      {message && (
        <div className={ui.alertInfo}>{message}</div>
      )}
      <section>
        <h2 className={ui.sectionTitle}>Horarios de la barbería</h2>
        <p className={`mb-4 mt-1 ${ui.muted}`}>
          Turnos de 40 minutos dentro de cada bloque horario.
        </p>
        <form onSubmit={handleSaveSchedule}>
          <ScheduleEditor value={schedule} onChange={setSchedule} />
          <button
            type="submit"
            disabled={saving}
            className={`mt-4 ${ui.btnPrimary}`}
          >
            {saving ? 'Guardando...' : 'Guardar horarios'}
          </button>
        </form>
      </section>
      <section>
        <form onSubmit={handleSaveManyChat} className="max-w-lg space-y-4">
          <h2 className={ui.sectionTitle}>ManyChat (Pro — opcional)</h2>
          {(['manychatApiKey', 'manychatFlowBooking', 'manychatFlowBarber', 'manychatFlowReminder'] as const).map(
            (field) => (
              <div key={field}>
                <label className={ui.label}>{field}</label>
                <input
                  value={form[field]}
                  onChange={(e) => setForm({ ...form, [field]: e.target.value })}
                  className={ui.input}
                />
              </div>
            )
          )}
          <button type="submit" disabled={saving} className={ui.btnPrimary}>
            Guardar ManyChat
          </button>
        </form>
      </section>
      {form.effectivePlan === 'pro' && (
        <section className="max-w-lg">
          <h2 className={ui.sectionTitle}>Dominio personalizado</h2>
          <input
            value={form.customDomain}
            onChange={(e) => setForm({ ...form, customDomain: e.target.value })}
            placeholder="www.mibarberia.com"
            className={`mt-2 ${ui.input}`}
          />
          <div className="mt-2 flex gap-2">
            <button type="button" onClick={saveCustomDomain} className={ui.btnSecondary}>
              Registrar en Vercel
            </button>
            <button type="button" onClick={checkDomainStatus} className={ui.btnSecondary}>
              Verificar DNS
            </button>
          </div>
          {form.domainVerified && <p className="mt-2 text-sm text-emerald-300">Dominio verificado</p>}
        </section>
      )}
    </div>
  );
}
