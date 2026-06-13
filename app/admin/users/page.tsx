'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';

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
  admin: 'bg-purple-100 text-purple-700',
  dueno: 'bg-amber-100 text-amber-700',
  barbero: 'bg-blue-100 text-blue-700',
};

const defaultForm = {
  name: '',
  username: '',
  password: '',
  photo: '',
  email: '',
  phone: '',
  role: 'barbero' as RoleType,
  isActive: true,
};

function StatusBadge({ active }: Readonly<{ active: boolean }>) {
  const className = active
    ? 'rounded-full bg-green-100 px-2 py-0.5 text-green-700'
    : 'rounded-full bg-neutral-200 px-2 py-0.5 text-neutral-600';
  const label = active ? 'Activo' : 'Inactivo';
  return <span className={className}>{label}</span>;
}

function RoleBadge({ role }: Readonly<{ role: string }>) {
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${ROLE_COLORS[role] ?? 'bg-neutral-100 text-neutral-600'}`}>
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
      const res = await fetch(`/api/admin/users/${user.id}`, {
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
      onSuccess();
      onClose();
    } catch {
      setError('Error de conexión');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-neutral-800">Editar usuario</h3>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-neutral-500 hover:bg-neutral-100 hover:text-neutral-700"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {error && (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label htmlFor="edit-name" className="mb-1 block text-sm font-medium text-neutral-700">Nombre *</label>
              <input id="edit-name" type="text" required minLength={2} maxLength={50}
                value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-neutral-900 focus:border-neutral-500 focus:outline-none focus:ring-1 focus:ring-neutral-500" />
            </div>
            <div>
              <label htmlFor="edit-username" className="mb-1 block text-sm font-medium text-neutral-700">Usuario (login) *</label>
              <input id="edit-username" type="text" required minLength={3} maxLength={30}
                value={form.username} onChange={(e) => setForm((f) => ({ ...f, username: e.target.value.toLowerCase().replaceAll(/\s/g, '_') }))}
                className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-neutral-900 focus:border-neutral-500 focus:outline-none focus:ring-1 focus:ring-neutral-500" />
            </div>
            <div>
              <label htmlFor="edit-password" className="mb-1 block text-sm font-medium text-neutral-700">Nueva contraseña (vacío = mantener)</label>
              <input id="edit-password" type="password" minLength={8}
                value={form.password} onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-neutral-900 focus:border-neutral-500 focus:outline-none focus:ring-1 focus:ring-neutral-500"
                placeholder="Mínimo 8 caracteres" />
            </div>
            <div>
              <label htmlFor="edit-phone" className="mb-1 block text-sm font-medium text-neutral-700">Teléfono (WhatsApp) *</label>
              <input id="edit-phone" type="tel" required minLength={10} maxLength={10}
                value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value.replaceAll(/\D/g, '') }))}
                className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-neutral-900 focus:border-neutral-500 focus:outline-none focus:ring-1 focus:ring-neutral-500"
                placeholder="3001234567" />
              <p className="mt-1 text-xs text-neutral-500">10 dígitos sin código de país</p>
            </div>
            <div>
              <label htmlFor="edit-email" className="mb-1 block text-sm font-medium text-neutral-700">Email</label>
              <input id="edit-email" type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-neutral-900 focus:border-neutral-500 focus:outline-none focus:ring-1 focus:ring-neutral-500" />
            </div>
            <div>
              <label htmlFor="edit-photo" className="mb-1 block text-sm font-medium text-neutral-700">Foto (ruta o URL)</label>
              <input id="edit-photo" type="text" value={form.photo} onChange={(e) => setForm((f) => ({ ...f, photo: e.target.value }))}
                className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-neutral-900 focus:border-neutral-500 focus:outline-none focus:ring-1 focus:ring-neutral-500" />
            </div>
            <div>
              <label htmlFor="edit-role" className="mb-1 block text-sm font-medium text-neutral-700">Rol</label>
              <select id="edit-role" value={form.role}
                onChange={(e) => setForm((f) => ({ ...f, role: e.target.value as RoleType }))}
                className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-neutral-900 focus:border-neutral-500 focus:outline-none focus:ring-1 focus:ring-neutral-500">
                <option value="admin">Administrador</option>
                <option value="dueno">Dueño</option>
                <option value="barbero">Barbero</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <input id="edit-isActive" type="checkbox" checked={form.isActive}
                onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
                className="h-4 w-4 rounded border-neutral-300" />
              <label htmlFor="edit-isActive" className="text-sm text-neutral-700">Usuario activo</label>
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <button type="button" onClick={onClose}
              className="rounded-lg border border-neutral-300 px-4 py-2 font-medium text-neutral-700 hover:bg-neutral-50">
              Cancelar
            </button>
            <button type="submit" disabled={submitting}
              className="rounded-lg bg-neutral-800 px-4 py-2 font-medium text-white hover:bg-neutral-700 disabled:opacity-50">
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
  const [form, setForm] = useState({
    name: user.name,
    phone: user.phone ? user.phone.replace('+57', '') : '',
    password: '',
    isActive: user.isActive,
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name.trim(),
          phone: form.phone.trim(),
          ...(form.password ? { password: form.password } : {}),
          isActive: form.isActive,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? 'Error al actualizar');
        return;
      }
      onSuccess();
      onClose();
    } catch {
      setError('Error de conexión');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-neutral-800">Editar usuario</h3>
          <button onClick={onClose} className="rounded-lg p-1 text-neutral-500 hover:bg-neutral-100 hover:text-neutral-700">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {error && (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">{error}</div>
          )}

          <div className="space-y-4">
            <div>
              <label htmlFor="owner-edit-name" className="mb-1 block text-sm font-medium text-neutral-700">Nombre *</label>
              <input id="owner-edit-name" type="text" required minLength={2} maxLength={50}
                value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-neutral-900 focus:border-neutral-500 focus:outline-none focus:ring-1 focus:ring-neutral-500" />
            </div>
            <div>
              <label htmlFor="owner-edit-phone" className="mb-1 block text-sm font-medium text-neutral-700">Teléfono (WhatsApp) *</label>
              <input id="owner-edit-phone" type="tel" required minLength={10} maxLength={10}
                value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value.replaceAll(/\D/g, '') }))}
                className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-neutral-900 focus:border-neutral-500 focus:outline-none focus:ring-1 focus:ring-neutral-500"
                placeholder="3001234567" />
              <p className="mt-1 text-xs text-neutral-500">10 dígitos sin código de país</p>
            </div>
            <div>
              <label htmlFor="owner-edit-password" className="mb-1 block text-sm font-medium text-neutral-700">Nueva contraseña</label>
              <input id="owner-edit-password" type="password" minLength={8}
                value={form.password} onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-neutral-900 focus:border-neutral-500 focus:outline-none focus:ring-1 focus:ring-neutral-500"
                placeholder="Mínimo 8 caracteres" autoComplete="new-password" />
              <p className="mt-1 text-xs text-neutral-500">Déjalo vacío para mantener la contraseña actual</p>
            </div>
            <div className="flex items-center gap-2">
              <input id="owner-edit-isActive" type="checkbox" checked={form.isActive}
                onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
                className="h-4 w-4 rounded border-neutral-300" />
              <label htmlFor="owner-edit-isActive" className="text-sm text-neutral-700">Usuario activo</label>
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <button type="button" onClick={onClose}
              className="rounded-lg border border-neutral-300 px-4 py-2 font-medium text-neutral-700 hover:bg-neutral-50">
              Cancelar
            </button>
            <button type="submit" disabled={submitting}
              className="rounded-lg bg-neutral-800 px-4 py-2 font-medium text-white hover:bg-neutral-700 disabled:opacity-50">
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100">
            <svg className="h-5 w-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-neutral-800">Eliminar usuario</h3>
        </div>
        <p className="mb-6 text-neutral-600">
          ¿Estás seguro de que deseas eliminar al usuario <strong>{user.name}</strong> ({user.username})? Esta acción no se puede deshacer.
        </p>
        <div className="flex justify-end gap-3">
          <button type="button" onClick={onClose} disabled={deleting}
            className="rounded-lg border border-neutral-300 px-4 py-2 font-medium text-neutral-700 hover:bg-neutral-50 disabled:opacity-50">
            Cancelar
          </button>
          <button type="button" onClick={onConfirm} disabled={deleting}
            className="rounded-lg bg-red-600 px-4 py-2 font-medium text-white hover:bg-red-700 disabled:opacity-50">
            {deleting ? 'Eliminando...' : 'Eliminar'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminUsersPage() {
  const { data: session } = useSession();
  const currentRole = session?.user?.role;
  const isAdmin = currentRole === 'admin';
  const isOwner = currentRole === 'dueno';

  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [form, setForm] = useState(defaultForm);

  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [deletingUser, setDeletingUser] = useState<User | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchUsers = () => {
    fetch('/api/admin/users')
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
    setSuccess(null);
    setSubmitting(true);

    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name.trim(),
          username: form.username.trim(),
          password: form.password,
          photo: form.photo.trim() || undefined,
          email: form.email.trim() || undefined,
          phone: form.phone.trim(),
          role: form.role,
          isActive: form.isActive,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? 'Error al crear usuario');
        return;
      }
      setSuccess('Usuario creado correctamente');
      setForm(defaultForm);
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
      const res = await fetch(`/api/admin/users/${deletingUser.id}`, {
        method: 'DELETE',
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? 'Error al eliminar usuario');
        return;
      }
      setSuccess('Usuario eliminado correctamente');
      setDeletingUser(null);
      fetchUsers();
    } catch {
      setError('Error de conexión');
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Formulario de crear usuario: SOLO para admin */}
      {isAdmin && (
        <>
          <h1 className="text-2xl font-bold text-neutral-800">Crear usuario</h1>
          <form onSubmit={handleSubmit} className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
            {error && (
              <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">{error}</div>
            )}
            {success && (
              <div className="mb-4 rounded-lg border border-green-200 bg-green-50 px-4 py-2 text-sm text-green-700">{success}</div>
            )}
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="name" className="mb-1 block text-sm font-medium text-neutral-700">Nombre *</label>
                <input id="name" type="text" required minLength={2} maxLength={50}
                  value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-neutral-900 focus:border-neutral-500 focus:outline-none focus:ring-1 focus:ring-neutral-500"
                  placeholder="Ej. Juan Pérez" />
              </div>
              <div>
                <label htmlFor="username" className="mb-1 block text-sm font-medium text-neutral-700">Usuario (login) *</label>
                <input id="username" type="text" required minLength={3} maxLength={30}
                  value={form.username} onChange={(e) => setForm((f) => ({ ...f, username: e.target.value.toLowerCase().replaceAll(/\s/g, '_') }))}
                  className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-neutral-900 focus:border-neutral-500 focus:outline-none focus:ring-1 focus:ring-neutral-500"
                  placeholder="Ej. juanperez" />
                <p className="mt-1 text-xs text-neutral-500">Solo letras, números y guión bajo</p>
              </div>
              <div>
                <label htmlFor="password" className="mb-1 block text-sm font-medium text-neutral-700">Contraseña *</label>
                <input id="password" type="password" required minLength={8}
                  value={form.password} onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                  className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-neutral-900 focus:border-neutral-500 focus:outline-none focus:ring-1 focus:ring-neutral-500"
                  placeholder="Mínimo 8 caracteres" />
              </div>
              <div>
                <label htmlFor="phone" className="mb-1 block text-sm font-medium text-neutral-700">Teléfono (WhatsApp) *</label>
                <input id="phone" type="tel" required minLength={10} maxLength={10}
                  value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value.replaceAll(/\D/g, '') }))}
                  className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-neutral-900 focus:border-neutral-500 focus:outline-none focus:ring-1 focus:ring-neutral-500"
                  placeholder="3001234567" />
                <p className="mt-1 text-xs text-neutral-500">10 dígitos sin código de país</p>
              </div>
              <div>
                <label htmlFor="email" className="mb-1 block text-sm font-medium text-neutral-700">Email</label>
                <input id="email" type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-neutral-900 focus:border-neutral-500 focus:outline-none focus:ring-1 focus:ring-neutral-500"
                  placeholder="opcional@ejemplo.com" />
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="photo" className="mb-1 block text-sm font-medium text-neutral-700">Foto (ruta o URL)</label>
                <input id="photo" type="text" value={form.photo} onChange={(e) => setForm((f) => ({ ...f, photo: e.target.value }))}
                  className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-neutral-900 focus:border-neutral-500 focus:outline-none focus:ring-1 focus:ring-neutral-500"
                  placeholder="/image/admin/foto.png" />
              </div>
              <div>
                <label htmlFor="role" className="mb-1 block text-sm font-medium text-neutral-700">Rol</label>
                <select id="role" value={form.role}
                  onChange={(e) => setForm((f) => ({ ...f, role: e.target.value as RoleType }))}
                  className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-neutral-900 focus:border-neutral-500 focus:outline-none focus:ring-1 focus:ring-neutral-500">
                  <option value="admin">Administrador</option>
                  <option value="dueno">Dueño</option>
                  <option value="barbero">Barbero</option>
                </select>
              </div>
              <div className="flex items-center gap-2 pt-6 sm:col-span-2">
                <input id="isActive" type="checkbox" checked={form.isActive}
                  onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
                  className="h-4 w-4 rounded border-neutral-300" />
                <label htmlFor="isActive" className="text-sm text-neutral-700">Usuario activo</label>
              </div>
            </div>
            <div className="mt-6">
              <button type="submit" disabled={submitting}
                className="rounded-lg bg-neutral-800 px-4 py-2 font-medium text-white hover:bg-neutral-700 disabled:opacity-50">
                {submitting ? 'Creando...' : 'Crear usuario'}
              </button>
            </div>
          </form>
        </>
      )}

      {/* Mensajes para dueño */}
      {isOwner && (
        <>
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">{error}</div>
          )}
          {success && (
            <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-2 text-sm text-green-700">{success}</div>
          )}
        </>
      )}

      {/* Lista de usuarios */}
      <section>
        <h2 className="mb-4 text-xl font-semibold text-neutral-800">
          {isOwner ? 'Equipo' : 'Usuarios existentes'}
        </h2>
        {(() => {
          const visibleUsers = isOwner ? users.filter((u) => u.role !== 'admin') : users;
          return loading ? (
          <p className="text-neutral-500">Cargando...</p>
        ) : visibleUsers.length === 0 ? (
          <p className="rounded-lg border border-neutral-200 bg-white p-4 text-neutral-500">
            Aún no hay usuarios.
          </p>
        ) : (
          <>
            {/* Vista móvil - Tarjetas */}
            <div className="space-y-3 md:hidden">
              {visibleUsers.map((u) => (
                <div key={u.id} className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
                  <div className="mb-3 flex items-start justify-between">
                    <div>
                      <h3 className="font-medium text-neutral-900">{u.name}</h3>
                      <p className="font-mono text-sm text-neutral-500">@{u.username}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      {/* Editar: admin completo, dueño limitado */}
                      {(isAdmin || isOwner) && (
                        <button onClick={() => setEditingUser(u)}
                          className="rounded-lg p-2 text-neutral-500 hover:bg-neutral-100 hover:text-neutral-700" title="Editar">
                          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                      )}
                      {/* Eliminar: solo admin */}
                      {isAdmin && (
                        <button onClick={() => setDeletingUser(u)}
                          className="rounded-lg p-2 text-neutral-500 hover:bg-red-50 hover:text-red-600" title="Eliminar">
                          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="space-y-2 text-sm">
                    {u.phone && (
                      <div className="flex items-center gap-2 text-neutral-600">
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
            <div className="hidden overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm md:block">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-neutral-200 bg-neutral-50">
                  <tr>
                    <th className="px-4 py-3 font-medium text-neutral-700">Nombre</th>
                    <th className="px-4 py-3 font-medium text-neutral-700">Usuario</th>
                    <th className="px-4 py-3 font-medium text-neutral-700">Teléfono</th>
                    <th className="px-4 py-3 font-medium text-neutral-700">Rol</th>
                    <th className="px-4 py-3 font-medium text-neutral-700">Estado</th>
                    {(isAdmin || isOwner) && (
                      <th className="px-4 py-3 font-medium text-neutral-700">Acciones</th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {visibleUsers.map((u) => (
                    <tr key={u.id} className="border-b border-neutral-100 last:border-0">
                      <td className="px-4 py-3">{u.name}</td>
                      <td className="px-4 py-3 font-mono text-neutral-600">{u.username}</td>
                      <td className="px-4 py-3 text-neutral-600">{u.phone ?? '—'}</td>
                      <td className="px-4 py-3"><RoleBadge role={u.role} /></td>
                      <td className="px-4 py-3"><StatusBadge active={u.isActive} /></td>
                      {(isAdmin || isOwner) && (
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <button onClick={() => setEditingUser(u)}
                              className="rounded-lg p-1.5 text-neutral-500 hover:bg-neutral-100 hover:text-neutral-700" title="Editar">
                              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                            {isAdmin && (
                              <button onClick={() => setDeletingUser(u)}
                                className="rounded-lg p-1.5 text-neutral-500 hover:bg-red-50 hover:text-red-600" title="Eliminar">
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
