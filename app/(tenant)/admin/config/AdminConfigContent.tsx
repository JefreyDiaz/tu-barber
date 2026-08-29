'use client';

import { useEffect, useState } from 'react';
import { ui } from '@/lib/admin-ui';
import { tenantApiUrl } from '@/lib/tenant/client-api';
import { useToast } from '@/components/ToastProvider';

const TWILIO_FIELDS = [
  { key: 'twilioAccountSid', label: 'Account SID' },
  { key: 'twilioAuthToken', label: 'Auth Token' },
  { key: 'twilioWhatsappFrom', label: 'WhatsApp From (ej. +14155238886)' },
  { key: 'twilioContentSidBooking', label: 'Content SID — confirmación cliente' },
  { key: 'twilioContentSidReminder', label: 'Content SID — recordatorio' },
] as const;

type TwilioFieldKey = (typeof TWILIO_FIELDS)[number]['key'];

export default function AdminConfigContent() {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [tenantId, setTenantId] = useState('');
  const [form, setForm] = useState({
    twilioAccountSid: '',
    twilioAuthToken: '',
    twilioWhatsappFrom: '',
    twilioContentSidBooking: '',
    twilioContentSidReminder: '',
    customDomain: '',
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
            twilioAccountSid: json.data.twilioAccountSid ?? '',
            twilioAuthToken: json.data.twilioAuthToken ?? '',
            twilioWhatsappFrom: json.data.twilioWhatsappFrom ?? '',
            twilioContentSidBooking: json.data.twilioContentSidBooking ?? '',
            twilioContentSidReminder: json.data.twilioContentSidReminder ?? '',
            customDomain: json.data.customDomain ?? '',
            domainVerified: json.data.domainVerified ?? false,
          }));
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  async function handleSaveTwilio(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const res = await fetch(tenantApiUrl('/api/admin/settings'), {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        twilioAccountSid: form.twilioAccountSid || undefined,
        twilioAuthToken: form.twilioAuthToken || undefined,
        twilioWhatsappFrom: form.twilioWhatsappFrom || undefined,
        twilioContentSidBooking: form.twilioContentSidBooking || undefined,
        twilioContentSidReminder: form.twilioContentSidReminder || undefined,
      }),
    });
    const json = await res.json();
    setSaving(false);
    if (json.success) toast.success('Twilio guardado correctamente');
    else toast.error(json.error ?? 'Error al guardar');
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
      toast.success(json.hint ?? 'Dominio registrado correctamente');
    } else {
      toast.error(json.error ?? 'Error');
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
      if (json.data.verified) toast.success('Dominio verificado correctamente');
      else toast.error('Pendiente de verificación DNS');
    }
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
        <h1 className={ui.title}>Ajustes avanzados</h1>
        <p className={ui.subtitle}>WhatsApp propio y dominio personalizado (plan Cadena)</p>
      </div>

      <section className={ui.card}>
        <form onSubmit={handleSaveTwilio} className="max-w-lg space-y-4">
          <h2 className={ui.sectionTitle}>Twilio WhatsApp</h2>
          <p className={`text-sm ${ui.muted}`}>
            Deja vacío para usar el WhatsApp de TuBarber. Si configuras Account SID y Auth Token,
            los mensajes salen de tu cuenta Twilio.
          </p>
          {TWILIO_FIELDS.map(({ key, label }) => (
            <div key={key}>
              <label className={ui.label}>{label}</label>
              <input
                type={key === 'twilioAuthToken' ? 'password' : 'text'}
                value={form[key as TwilioFieldKey]}
                onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                className={ui.input}
                autoComplete="off"
              />
            </div>
          ))}
          <button type="submit" disabled={saving} className={ui.btnPrimary}>
            {saving ? 'Guardando...' : 'Guardar Twilio'}
          </button>
        </form>
      </section>

      <section className={`${ui.card} max-w-lg`}>
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
        {form.domainVerified && (
          <p className="mt-2 text-sm text-emerald-300">Dominio verificado</p>
        )}
      </section>
    </div>
  );
}
