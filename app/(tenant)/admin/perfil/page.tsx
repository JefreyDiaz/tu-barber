'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import PhotoUploadField from '@/components/PhotoUploadField';
import { ui } from '@/lib/admin-ui';
import { tenantApiUrl } from '@/lib/tenant/client-api';

type Profile = {
  id: string;
  name: string;
  username: string;
  photo: string | null;
  phone: string | null;
  role: string;
};

export default function AdminPerfilPage() {
  const { data: session, update } = useSession();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', phone: '', password: '' });
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);

  useEffect(() => {
    fetch(tenantApiUrl('/api/admin/me'))
      .then(async (r) => {
        if (!r.ok) throw new Error('Error al cargar perfil');
        return r.json();
      })
      .then((json) => {
        if (json.success && json.data) {
          setProfile(json.data);
          setForm({
            name: json.data.name,
            phone: json.data.phone?.replace('+57', '') ?? '',
            password: '',
          });
          setPhotoUrl(json.data.photo);
        }
      })
      .catch(() => setError('No se pudo cargar tu perfil'))
      .finally(() => setLoading(false));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch(tenantApiUrl('/api/admin/me'), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name.trim(),
          phone: form.phone.trim(),
          photo: photoUrl ?? '',
          ...(form.password ? { password: form.password } : {}),
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? 'Error al guardar');
        return;
      }
      setSuccess('Perfil actualizado');
      setProfile(json.data);
      await update({ name: json.data.name, image: json.data.photo });
    } catch {
      setError('Error de conexión');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <p className={ui.muted}>Cargando...</p>;
  }

  if (!profile) {
    return <p className="text-red-300">{error ?? 'Perfil no encontrado'}</p>;
  }

  return (
    <div className={`mx-auto max-w-lg ${ui.page}`}>
      <div>
        <h1 className={ui.title}>Mi perfil</h1>
        <p className={ui.subtitle}>
          Tu foto aparece en el sitio público cuando eres barbero o dueño. Usuario: @{profile.username}
        </p>
      </div>

      {error && (
        <div className={ui.alertError}>{error}</div>
      )}
      {success && (
        <div className={ui.alertSuccess}>{success}</div>
      )}

      <form onSubmit={handleSubmit} className={`space-y-6 ${ui.card}`}>
        <PhotoUploadField
          userId={profile.id}
          currentPhoto={photoUrl}
          onUploaded={async (url) => {
            setPhotoUrl(url);
            setSuccess('Foto actualizada');
            await update({ image: url });
          }}
        />

        <div>
          <label htmlFor="profile-name" className={ui.label}>
            Nombre *
          </label>
          <input
            id="profile-name"
            required
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            className={ui.input}
          />
        </div>

        <div>
          <label htmlFor="profile-phone" className={ui.label}>
            Teléfono (WhatsApp) *
          </label>
          <input
            id="profile-phone"
            type="tel"
            required
            maxLength={10}
            value={form.phone}
            onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value.replace(/\D/g, '') }))}
            className={ui.input}
            placeholder="3001234567"
          />
        </div>

        <div>
          <label htmlFor="profile-password" className={ui.label}>
            Nueva contraseña
          </label>
          <input
            id="profile-password"
            type="password"
            minLength={8}
            value={form.password}
            onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
            className={ui.input}
            placeholder="Opcional"
          />
        </div>

        <button
          type="submit"
          disabled={saving}
          className={ui.btnPrimary}
        >
          {saving ? 'Guardando...' : 'Guardar cambios'}
        </button>
      </form>
    </div>
  );
}
