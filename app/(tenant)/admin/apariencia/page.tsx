'use client';

import { useEffect, useState } from 'react';
import BrandingUploadField from '@/components/BrandingUploadField';
import { ui } from '@/lib/admin-ui';
import {
  DEFAULT_BACKGROUND_URL,
  DEFAULT_PRIMARY_COLOR,
  DEFAULT_SECONDARY_COLOR,
} from '@/lib/tenant/branding';
import { tenantApiUrl } from '@/lib/tenant/client-api';

export default function AdminAparienciaPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [form, setForm] = useState({
    logoUrl: '',
    backgroundUrl: '',
    primaryColor: DEFAULT_PRIMARY_COLOR,
    secondaryColor: DEFAULT_SECONDARY_COLOR,
  });

  useEffect(() => {
    fetch(tenantApiUrl('/api/admin/settings'))
      .then((r) => r.json())
      .then((json) => {
        if (json.success && json.data) {
          setForm({
            logoUrl: json.data.logoUrl ?? '',
            backgroundUrl: json.data.backgroundUrl ?? '',
            primaryColor: json.data.primaryColor ?? DEFAULT_PRIMARY_COLOR,
            secondaryColor: json.data.secondaryColor ?? DEFAULT_SECONDARY_COLOR,
          });
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  async function persistBranding(patch: Partial<typeof form>) {
    const payload = { ...form, ...patch };
    const res = await fetch(tenantApiUrl('/api/admin/settings/branding'), {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        logoUrl: payload.logoUrl || '',
        backgroundUrl: payload.backgroundUrl || '',
        primaryColor: payload.primaryColor,
        secondaryColor: payload.secondaryColor,
      }),
    });

    const text = await res.text();
    let json: { success?: boolean; error?: string } = {};
    if (text) {
      try {
        json = JSON.parse(text) as { success?: boolean; error?: string };
      } catch {
        throw new Error('Respuesta inválida del servidor');
      }
    }

    if (!res.ok || !json.success) {
      throw new Error(json.error ?? 'Error al guardar');
    }

    setForm(payload);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      await persistBranding(form);
      setMessage('Apariencia guardada');
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Error de conexión al guardar');
    } finally {
      setSaving(false);
    }
  }

  async function resetBackground() {
    setMessage(null);
    try {
      await persistBranding({ backgroundUrl: '' });
      setMessage('Fondo restaurado al predeterminado');
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Error al restaurar fondo');
    }
  }

  function resetColors() {
    setForm((f) => ({
      ...f,
      primaryColor: DEFAULT_PRIMARY_COLOR,
      secondaryColor: DEFAULT_SECONDARY_COLOR,
    }));
  }

  const hasCustomColors =
    form.primaryColor.toLowerCase() !== DEFAULT_PRIMARY_COLOR.toLowerCase() ||
    form.secondaryColor.toLowerCase() !== DEFAULT_SECONDARY_COLOR.toLowerCase();

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
        <h1 className={ui.title}>Apariencia del sitio</h1>
        <p className={ui.subtitle}>
          Personaliza cómo ven tus clientes la página principal y el flujo de reservas
        </p>
      </div>

      {message && (
        <p
          className={
            message === 'Apariencia guardada' || message === 'Fondo restaurado al predeterminado'
              ? ui.alertSuccess
              : ui.alertError
          }
        >
          {message}
        </p>
      )}

      <form onSubmit={handleSave} className="space-y-8">
        <section className={ui.card}>
          <h2 className={ui.sectionTitle}>Logo</h2>
          <p className={`mt-1 ${ui.muted}`}>Se muestra en la página principal de tu barbería</p>
          <div className="mt-4">
            <BrandingUploadField
              kind="logo"
              label="Logo de la barbería"
              hint="JPG, PNG o WebP · máx. 2 MB · fondo transparente recomendado"
              currentUrl={form.logoUrl || null}
              onUploaded={async (url) => {
                setForm((f) => ({ ...f, logoUrl: url }));
              }}
            />
          </div>
        </section>

        <section className={ui.card}>
          <h2 className={ui.sectionTitle}>Fondo del sitio</h2>
          <p className={`mt-1 ${ui.muted}`}>Imagen o video de fondo en la página principal</p>
          <div className="mt-4 space-y-3">
            <BrandingUploadField
              kind="background"
              label="Archivo de fondo"
              hint="Imagen (2 MB) o video MP4/WebM (15 MB)"
              previewClassName="h-32 w-full max-w-md"
              currentUrl={form.backgroundUrl || DEFAULT_BACKGROUND_URL}
              onUploaded={async (url) => {
                setForm((f) => ({ ...f, backgroundUrl: url }));
              }}
            />
            {form.backgroundUrl && (
              <button type="button" onClick={resetBackground} className={ui.btnGhost}>
                Restaurar fondo predeterminado
              </button>
            )}
          </div>
        </section>

        <section className={ui.card}>
          <h2 className={ui.sectionTitle}>Colores de marca</h2>
          <p className={`mt-1 ${ui.muted}`}>Botones, acentos y detalles en reservas</p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <ColorField
              label="Color primario"
              value={form.primaryColor}
              onChange={(v) => setForm((f) => ({ ...f, primaryColor: v }))}
            />
            <ColorField
              label="Color secundario"
              value={form.secondaryColor}
              onChange={(v) => setForm((f) => ({ ...f, secondaryColor: v }))}
            />
          </div>
          {hasCustomColors && (
            <button type="button" onClick={resetColors} className={`mt-4 ${ui.btnGhost}`}>
              Restaurar colores predeterminados
            </button>
          )}
          <BrandPreview primary={form.primaryColor} secondary={form.secondaryColor} />
        </section>

        <button type="submit" disabled={saving} className={ui.btnPrimary}>
          {saving ? 'Guardando...' : 'Guardar apariencia'}
        </button>
      </form>
    </div>
  );
}

function BrandPreview({ primary, secondary }: { primary: string; secondary: string }) {
  const accentSoft = `${primary}33`;
  const accentBorder = `${primary}80`;

  return (
    <div className="mt-6 rounded-2xl border border-white/10 bg-black/20 p-4">
      <p className="mb-3 text-xs uppercase tracking-wider text-white/40">Vista previa</p>
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          className="rounded-xl px-4 py-2 text-sm font-semibold shadow-md"
          style={{
            background: `linear-gradient(135deg, ${primary}, ${secondary})`,
            color: '#1c1917',
          }}
        >
          Confirmar reserva
        </button>
        <span className="text-sm font-medium" style={{ color: primary }}>
          Texto de acento
        </span>
        <span
          className="rounded-xl border px-3 py-1.5 text-sm"
          style={{
            color: primary,
            borderColor: accentBorder,
            backgroundColor: accentSoft,
          }}
        >
          Servicio seleccionado
        </span>
      </div>
    </div>
  );
}

function ColorField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <label className={ui.label}>{label}</label>
      <div className="mt-1 flex items-center gap-3">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-11 w-14 cursor-pointer rounded-lg border border-white/15 bg-transparent"
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          pattern="^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$"
          className={ui.input}
        />
      </div>
    </div>
  );
}
