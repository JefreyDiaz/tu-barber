'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import PhotoUploadField from '@/components/PhotoUploadField';
import { ui } from '@/lib/admin-ui';
import { tenantApiUrl } from '@/lib/tenant/client-api';
import { sanitizeUsernameInput } from '@/lib/validations/username';
import { useToast } from '@/components/ToastProvider';

type User = {
  id: string;
  name: string;
  username: string;
  photo: string | null;
  email: string | null;
  phone: string | null;
  role: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

type RoleType = 'admin' | 'dueno' | 'barbero';

const ROLE_LABELS: Record<string, string> = {
  admin: 'Administrador',
  dueno: 'Dueño',
  barbero: 'Barbero',
};

const ROLE_COLORS: Record<string, string> = {
  admin: 'bg-purple-500/20 text-purple-300',
  dueno: 'bg-amber-500/20 text-amber-300',
  barbero: 'bg-blue-500/20 text-blue-300',
};

const defaultForm = {
  name: '',
  username: '',
  photo: '',
  email: '',
  phone: '',
  role: 'barbero' as RoleType,
  isActive: true,
};

function ChevronIcon({ open }: Readonly<{ open: boolean }>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      className={`h-5 w-5 shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
      aria-hidden
    >
      <path
        fillRule="evenodd"
        d="M5.22 8.22a.75.75 0 011.06 0L10 11.94l3.72-3.72a.75.75 0 111.06 1.06l-4.25 4.25a.75.75 0 01-1.06 0L5.22 9.28a.75.75 0 010-1.06z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function StatusBadge({ active }: Readonly<{ active: boolean }>) {
  const className = active
    ? 'rounded-full bg-emerald-500/20 px-2 py-0.5 text-emerald-300'
    : 'rounded-full bg-white/10 px-2 py-0.5 text-white/45';
  const label = active ? 'Activo' : 'Inactivo';
  return <span className={className}>{label}</span>;
}

function RoleBadge({ role }: Readonly<{ role: string }>) {
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${ROLE_COLORS[role] ?? 'bg-white/10 text-white/55'}`}>
      {ROLE_LABELS[role] ?? role}
    </span>
  );
}

// Modal de edición COMPLETA (para admin)
function EditUserModal({
  user,
  onClose,
  onSuccess,
}: Readonly<{
  user: User;
  onClose: () => void;
  onSuccess: () => void;
}>) {
  const toast = useToast();
  const [form, setForm] = useState({
    name: user.name,
    username: user.username,
    password: '',
    photo: user.photo ?? '',
    email: user.email ?? '',
    phone: user.phone ? user.phone.replace('+57', '') : '',
    role: user.role as RoleType,
    isActive: user.isActive,
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const res = await fetch(tenantApiUrl(`/api/admin/users/${user.id}`), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name.trim(),
          username: form.username.trim(),
          password: form.password || undefined,
          photo: form.photo.trim() || undefined,
          email: form.email.trim() || undefined,
          phone: form.phone.trim(),
          role: form.role,
          isActive: form.isActive,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? 'Error al actualizar usuario');
        return;
      }
      toast.success('Usuario actualizado correctamente');
      onSuccess();
      onClose();
    } catch {
      setError('Error de conexión');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={ui.modalOverlay}>
      <div className={`${ui.modal} max-h-[90vh] max-w-lg overflow-y-auto`}>
        <div className="mb-4 flex items-center justify-between">
          <h3 className={ui.sectionTitle}>Editar usuario</h3>
          <button
            onClick={onClose}
            className={ui.btnGhost}
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {error && (
            <div className={`mb-4 ${ui.alertError}`}>
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label htmlFor="edit-name" className={ui.label}>Nombre *</label>
              <input id="edit-name" type="text" required minLength={2} maxLength={50}
                value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                className={ui.input} />
            </div>
            <div>
              <label htmlFor="edit-username" className={ui.label}>Usuario (login) *</label>
              <input id="edit-username" type="text" required minLength={3} maxLength={30}
                value={form.username} onChange={(e) => setForm((f) => ({ ...f, username: sanitizeUsernameInput(e.target.value) }))}
                className={ui.input} />
            </div>
            <div>
              <label htmlFor="edit-password" className={ui.label}>Nueva contraseña (vacío = mantener)</label>
              <input id="edit-password" type="password" minLength={8}
                value={form.password} onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                className={ui.input}
                placeholder="Mínimo 8 caracteres" />
            </div>
            <div>
              <label htmlFor="edit-phone" className={ui.label}>Teléfono (WhatsApp) *</label>
              <input id="edit-phone" type="tel" required minLength={10} maxLength={10}
                value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value.replaceAll(/\D/g, '') }))}
                className={ui.input}
                placeholder="3001234567" />
              <p className={`mt-1 ${ui.muted}`}>10 dígitos sin código de país</p>
            </div>
            <div>
              <label htmlFor="edit-email" className={ui.label}>Email</label>
              <input id="edit-email" type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                className={ui.input} />
            </div>
            <div>
              <PhotoUploadField
                userId={user.id}
                currentPhoto={form.photo}
                onUploaded={(url) => setForm((f) => ({ ...f, photo: url }))}
              />
            </div>
            <div>
              <label htmlFor="edit-role" className={ui.label}>Rol</label>
              <select id="edit-role" value={form.role}
                onChange={(e) => setForm((f) => ({ ...f, role: e.target.value as RoleType }))}
                className={ui.input}>
                <option value="admin">Administrador</option>
                <option value="dueno">Dueño</option>
                <option value="barbero">Barbero</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <input id="edit-isActive" type="checkbox" checked={form.isActive}
                onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
                className="h-4 w-4 rounded border-white/20 bg-white/5" />
              <label htmlFor="edit-isActive" className="text-sm text-white/75">Usuario activo</label>
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <button type="button" onClick={onClose}
              className={ui.btnSecondary}>
              Cancelar
            </button>
            <button type="submit" disabled={submitting}
              className={ui.btnPrimary}>
              {submitting ? 'Guardando...' : 'Guardar cambios'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Modal de edición LIMITADA (para dueño: solo nombre y teléfono)
function EditUserLimitedModal({
  user,
  onClose,
  onSuccess,
}: Readonly<{
  user: User;
  onClose: () => void;
  onSuccess: () => void;
}>) {
  const toast = useToast();
  const [form, setForm] = useState({
    name: user.name,
    phone: user.phone ? user.phone.replace('+57', '') : '',
    password: '',
    isActive: user.isActive,
    photo: user.photo ?? '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const res = await fetch(tenantApiUrl(`/api/admin/users/${user.id}`), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name.trim(),
          phone: form.phone.trim(),
          photo: form.photo || '',
          ...(form.password ? { password: form.password } : {}),
          isActive: form.isActive,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? 'Error al actualizar');
        return;
      }
      toast.success('Usuario actualizado correctamente');
      onSuccess();
      onClose();
    } catch {
      setError('Error de conexión');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={ui.modalOverlay}>
      <div className={ui.modal}>
        <div className="mb-4 flex items-center justify-between">
          <h3 className={ui.sectionTitle}>Editar usuario</h3>
          <button onClick={onClose} className={ui.btnGhost}>
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {error && (
            <div className={`mb-4 ${ui.alertError}`}>{error}</div>
          )}

          <div className="space-y-4">
            <PhotoUploadField
              userId={user.id}
              currentPhoto={form.photo}
              onUploaded={(url) => setForm((f) => ({ ...f, photo: url }))}
            />
            <div>
              <label htmlFor="owner-edit-name" className={ui.label}>Nombre *</label>
              <input id="owner-edit-name" type="text" required minLength={2} maxLength={50}
                value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                className={ui.input} />
            </div>
            <div>
              <label htmlFor="owner-edit-phone" className={ui.label}>Teléfono (WhatsApp) *</label>
              <input id="owner-edit-phone" type="tel" required minLength={10} maxLength={10}
                value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value.replaceAll(/\D/g, '') }))}
                className={ui.input}
                placeholder="3001234567" />
              <p className={`mt-1 ${ui.muted}`}>10 dígitos sin código de país</p>
            </div>
            <div>
              <label htmlFor="owner-edit-password" className={ui.label}>Nueva contraseña</label>
              <input id="owner-edit-password" type="password" minLength={8}
                value={form.password} onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                className={ui.input}
                placeholder="Mínimo 8 caracteres" autoComplete="new-password" />
              <p className={`mt-1 ${ui.muted}`}>Déjalo vacío para mantener la contraseña actual</p>
            </div>
            <div className="flex items-center gap-2">
              <input id="owner-edit-isActive" type="checkbox" checked={form.isActive}
                onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
                className="h-4 w-4 rounded border-white/20 bg-white/5" />
              <label htmlFor="owner-edit-isActive" className="text-sm text-white/75">Usuario activo</label>
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <button type="button" onClick={onClose}
              className={ui.btnSecondary}>
              Cancelar
            </button>
            <button type="submit" disabled={submitting}
              className={ui.btnPrimary}>
              {submitting ? 'Guardando...' : 'Guardar cambios'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Modal de confirmación para eliminar
function DeleteConfirmModal({
  user,
  onClose,
  onConfirm,
  deleting,
}: Readonly<{
  user: User;
  onClose: () => void;
  onConfirm: () => void;
  deleting: boolean;
}>) {
  return (
    <div className={ui.modalOverlay}>
      <div className={ui.modal}>
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-500/20">
            <svg className="h-5 w-5 text-red-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h3 className={ui.sectionTitle}>Eliminar usuario</h3>
        </div>
        <p className="mb-6 text-white/70">
          ¿Estás seguro de que deseas eliminar al usuario <strong className="text-white/90">{user.name}</strong> ({user.username})? Esta acción no se puede deshacer.
        </p>
        <div className="flex justify-end gap-3">
          <button type="button" onClick={onClose} disabled={deleting}
            className={ui.btnSecondary}>
            Cancelar
          </button>
          <button type="button" onClick={onConfirm} disabled={deleting}
            className={ui.btnDanger}>
            {deleting ? 'Eliminando...' : 'Eliminar'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminUsersPage() {
  const { data: session } = useSession();
  const toast = useToast();
  const currentRole = session?.user?.role;
  const isAdmin = currentRole === 'admin';
  const isOwner = currentRole === 'dueno';

  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState(defaultForm);
  const [createOpen, setCreateOpen] = useState(false);

  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [deletingUser, setDeletingUser] = useState<User | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchUsers = () => {
    fetch(tenantApiUrl('/api/admin/users'))
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setUsers(data.data ?? []);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const res = await fetch(tenantApiUrl('/api/admin/users'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name.trim(),
          username: form.username.trim(),
          photo: form.photo.trim() || undefined,
          email: form.email.trim(),
          phone: form.phone.trim(),
          role: isOwner && !isAdmin ? 'barbero' : form.role,
          isActive: form.isActive,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? 'Error al crear usuario');
        return;
      }
      if (data.warning) {
        toast.error(data.warning);
      } else {
        toast.success('Usuario creado. Se enviaron las credenciales por correo.');
      }
      setForm(defaultForm);
      setCreateOpen(false);
      fetchUsers();
    } catch {
      setError('Error de conexión');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingUser) return;
    setDeleteLoading(true);

    try {
      const res = await fetch(tenantApiUrl(`/api/admin/users/${deletingUser.id}`), {
        method: 'DELETE',
      });
      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error ?? 'Error al eliminar usuario');
        return;
      }
      toast.success('Usuario eliminado correctamente');
      setDeletingUser(null);
      fetchUsers();
    } catch {
      toast.error('Error de conexión');
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className={ui.pageWide}>
      {/* Formulario de crear usuario: admin (todos) o dueño (solo barberos) */}
      {(isAdmin || isOwner) && (
        <section className="space-y-3">
          <button
            type="button"
            onClick={() => setCreateOpen((open) => !open)}
            className="flex w-full items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-left transition-colors hover:bg-white/[0.07]"
            aria-expanded={createOpen}
          >
            <span className="text-lg font-semibold text-white/90">
              {isOwner && !isAdmin ? 'Agregar barbero' : 'Crear usuario'}
            </span>
            <ChevronIcon open={createOpen} />
          </button>

          {createOpen && (
          <form onSubmit={handleSubmit} className={ui.card}>
            {error && (
              <div className={`mb-4 ${ui.alertError}`}>{error}</div>
            )}
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="name" className={ui.label}>Nombre *</label>
                <input id="name" type="text" required minLength={2} maxLength={50}
                  value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  className={ui.input}
                  placeholder="Ej. Juan Pérez" />
              </div>
              <div>
                <label htmlFor="username" className={ui.label}>Usuario (login) *</label>
                <input id="username" type="text" required minLength={3} maxLength={30}
                  value={form.username} onChange={(e) => setForm((f) => ({ ...f, username: sanitizeUsernameInput(e.target.value) }))}
                  className={ui.input}
                  placeholder="Ej. juanperez" />
                <p className={`mt-1 ${ui.muted}`}>Solo letras, números y guión bajo</p>
              </div>
              <div>
                <label htmlFor="phone" className={ui.label}>Teléfono (WhatsApp) *</label>
                <input id="phone" type="tel" required minLength={10} maxLength={10}
                  value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value.replaceAll(/\D/g, '') }))}
                  className={ui.input}
                  placeholder="3001234567" />
                <p className={`mt-1 ${ui.muted}`}>10 dígitos sin código de país</p>
              </div>
              <div>
                <label htmlFor="email" className={ui.label}>Email *</label>
                <input id="email" type="email" required value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  className={ui.input}
                  placeholder="usuario@ejemplo.com" />
                <p className={`mt-1 ${ui.muted}`}>Se enviarán las credenciales iniciales a este correo</p>
              </div>
              <div className={`sm:col-span-2 rounded-xl border border-dashed border-white/15 bg-white/5 px-4 py-3 text-sm text-white/70`}>
                La contraseña se genera automáticamente. Después de crear el usuario, edítalo para subir su foto de perfil.
              </div>
              {isAdmin ? (
                <div>
                  <label htmlFor="role" className={ui.label}>Rol</label>
                  <select id="role" value={form.role}
                    onChange={(e) => setForm((f) => ({ ...f, role: e.target.value as RoleType }))}
                    className={ui.input}>
                    <option value="admin">Administrador</option>
                    <option value="dueno">Dueño</option>
                    <option value="barbero">Barbero</option>
                  </select>
                </div>
              ) : (
                <input type="hidden" name="role" value="barbero" />
              )}
              <div className="flex items-center gap-2 pt-6 sm:col-span-2">
                <input id="isActive" type="checkbox" checked={form.isActive}
                  onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
                  className="h-4 w-4 rounded border-white/20 bg-white/5" />
                <label htmlFor="isActive" className="text-sm text-white/75">Usuario activo</label>
              </div>
            </div>
            <div className="mt-6 flex flex-wrap gap-3">
              <button type="submit" disabled={submitting}
                className={ui.btnPrimary}>
                {submitting ? 'Creando...' : 'Crear usuario'}
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={() => {
                  setCreateOpen(false);
                  setError(null);
                  setForm(defaultForm);
                }}
                className={ui.btnSecondary}
              >
                Cancelar
              </button>
            </div>
          </form>
          )}
        </section>
      )}

      {/* Mensajes para dueño */}
      {isOwner && error && (
        <div className={ui.alertError}>{error}</div>
      )}

      {/* Lista de usuarios */}
      <section>
        <h2 className={`mb-4 ${ui.sectionTitle}`}>
          {isOwner ? 'Equipo' : 'Usuarios existentes'}
        </h2>
        {(() => {
          const visibleUsers = isOwner ? users.filter((u) => u.role !== 'admin') : users;
          return loading ? (
          <p className={ui.muted}>Cargando...</p>
        ) : visibleUsers.length === 0 ? (
          <p className={`${ui.empty} text-white/50`}>
            Aún no hay usuarios.
          </p>
        ) : (
          <>
            {/* Vista móvil - Tarjetas */}
            <div className="space-y-3 md:hidden">
              {visibleUsers.map((u) => (
                <div key={u.id} className={ui.listItem}>
                  <div className="mb-3 flex items-start justify-between">
                    <div>
                      <h3 className="font-medium text-white/90">{u.name}</h3>
                      <p className="font-mono text-sm text-white/55">@{u.username}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      {/* Editar: admin completo, dueño limitado */}
                      {(isAdmin || isOwner) && (
                        <button onClick={() => setEditingUser(u)}
                          className={`p-2 ${ui.btnGhost}`} title="Editar">
                          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                      )}
                      {/* Eliminar: solo admin */}
                      {isAdmin && (
                        <button onClick={() => setDeletingUser(u)}
                          className={`p-2 text-red-300 hover:bg-red-500/20 ${ui.btnGhost}`} title="Eliminar">
                          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="space-y-2 text-sm">
                    {u.phone && (
                      <div className="flex items-center gap-2 text-white/55">
                        <svg className="h-4 w-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                        <span className="truncate">{u.phone}</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between pt-2">
                      <RoleBadge role={u.role} />
                      <StatusBadge active={u.isActive} />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Vista desktop - Tabla */}
            <div className="glass-card hidden overflow-hidden rounded-2xl md:block">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-white/10 bg-white/5">
                  <tr>
                    <th className="px-4 py-3 font-medium text-white/75">Nombre</th>
                    <th className="px-4 py-3 font-medium text-white/75">Usuario</th>
                    <th className="px-4 py-3 font-medium text-white/75">Teléfono</th>
                    <th className="px-4 py-3 font-medium text-white/75">Rol</th>
                    <th className="px-4 py-3 font-medium text-white/75">Estado</th>
                    {(isAdmin || isOwner) && (
                      <th className="px-4 py-3 font-medium text-white/75">Acciones</th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {visibleUsers.map((u) => (
                    <tr key={u.id} className="border-b border-white/10 last:border-0">
                      <td className="px-4 py-3 text-white/90">{u.name}</td>
                      <td className="px-4 py-3 font-mono text-white/55">{u.username}</td>
                      <td className="px-4 py-3 text-white/55">{u.phone ?? '—'}</td>
                      <td className="px-4 py-3"><RoleBadge role={u.role} /></td>
                      <td className="px-4 py-3"><StatusBadge active={u.isActive} /></td>
                      {(isAdmin || isOwner) && (
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <button onClick={() => setEditingUser(u)}
                              className={`p-1.5 ${ui.btnGhost}`} title="Editar">
                              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                            {isAdmin && (
                              <button onClick={() => setDeletingUser(u)}
                                className={`p-1.5 text-red-300 hover:bg-red-500/20 ${ui.btnGhost}`} title="Eliminar">
                                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            )}
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        );
        })()}
      </section>

      {/* Modal de edición: admin ve todo, dueño solo nombre y teléfono */}
      {editingUser && isAdmin && (
        <EditUserModal user={editingUser} onClose={() => setEditingUser(null)} onSuccess={fetchUsers} />
      )}
      {editingUser && isOwner && (
        <EditUserLimitedModal user={editingUser} onClose={() => setEditingUser(null)} onSuccess={fetchUsers} />
      )}

      {/* Modal de eliminación: solo admin */}
      {deletingUser && isAdmin && (
        <DeleteConfirmModal user={deletingUser} onClose={() => setDeletingUser(null)} onConfirm={handleDelete} deleting={deleteLoading} />
      )}
    </div>
  );
}
