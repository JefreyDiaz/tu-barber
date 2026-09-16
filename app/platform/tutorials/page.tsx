'use client';

import { useEffect, useRef, useState } from 'react';
import PlatformAdminHeader from '@/components/platform/PlatformAdminHeader';
import { useToast } from '@/components/ToastProvider';

type Tutorial = {
  id: string;
  sortOrder: number;
  title: string;
  description: string;
  imageUrl: string;
  linkUrl: string;
  isActive: boolean;
};

type FormState = {
  title: string;
  description: string;
  imageUrl: string;
  linkUrl: string;
  isActive: boolean;
};

const emptyForm: FormState = {
  title: '',
  description: '',
  imageUrl: '',
  linkUrl: '',
  isActive: true,
};

function sortTutorials(items: Tutorial[]): Tutorial[] {
  return [...items].sort((a, b) => a.sortOrder - b.sortOrder || a.title.localeCompare(b.title));
}

function reorderList(items: Tutorial[], fromId: string, toId: string): Tutorial[] {
  const sorted = sortTutorials(items);
  const fromIndex = sorted.findIndex((t) => t.id === fromId);
  const toIndex = sorted.findIndex((t) => t.id === toId);
  if (fromIndex < 0 || toIndex < 0 || fromIndex === toIndex) return sorted;

  const next = [...sorted];
  const [moved] = next.splice(fromIndex, 1);
  next.splice(toIndex, 0, moved);
  return next.map((tutorial, index) => ({ ...tutorial, sortOrder: index + 1 }));
}

function ChevronIcon({ open }: { readonly open: boolean }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      className={`h-5 w-5 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
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

function DragHandleIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5" aria-hidden>
      <path d="M7 4a1 1 0 100 2 1 1 0 000-2zM7 9a1 1 0 100 2 1 1 0 000-2zM7 14a1 1 0 100 2 1 1 0 000-2zM13 4a1 1 0 100 2 1 1 0 000-2zM13 9a1 1 0 100 2 1 1 0 000-2zM13 14a1 1 0 100 2 1 1 0 000-2z" />
    </svg>
  );
}

export default function PlatformTutorialsPage() {
  const toast = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [tutorials, setTutorials] = useState<Tutorial[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Tutorial | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [reordering, setReordering] = useState(false);
  const [draftTutorialId, setDraftTutorialId] = useState<string | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);

  function load() {
    setLoading(true);
    setError(null);
    fetch('/api/platform/tutorials')
      .then(async (r) => {
        if (!r.ok) {
          const body = await r.json().catch(() => ({}));
          throw new Error(body.error ?? `Error ${r.status}`);
        }
        return r.json();
      })
      .then((json) => {
        if (json.success) {
          setTutorials(sortTutorials(json.data ?? []));
        } else {
          setError(json.error ?? 'Error al cargar tutoriales');
        }
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
  }, []);

  function resetForm() {
    setEditing(null);
    setDraftTutorialId(null);
    setForm(emptyForm);
    setFormOpen(false);
  }

  async function persistOrder(next: Tutorial[]) {
    setReordering(true);
    try {
      const res = await fetch('/api/platform/tutorials/reorder', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderedIds: next.map((t) => t.id) }),
      });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error ?? 'Error al guardar el orden');
        load();
        return;
      }
      setTutorials(sortTutorials(json.data ?? next));
    } catch {
      toast.error('Error de conexión al guardar el orden');
      load();
    } finally {
      setReordering(false);
    }
  }

  async function uploadImage(file: File, tutorialId?: string) {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      if (tutorialId) formData.append('tutorialId', tutorialId);

      const res = await fetch('/api/platform/tutorials/upload', {
        method: 'POST',
        body: formData,
      });
      const json = await res.json();
      if (!res.ok || !json.success || !json.data?.url) {
        toast.error(json.error ?? 'Error al subir imagen');
        return;
      }
      setForm((prev) => ({ ...prev, imageUrl: json.data.url }));
      if (json.data.tutorialId) setDraftTutorialId(json.data.tutorialId);
      toast.success('Imagen subida');
    } catch {
      toast.error('Error de conexión al subir imagen');
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);

    const payload = {
      title: form.title.trim(),
      description: form.description.trim(),
      imageUrl: form.imageUrl.trim(),
      linkUrl: form.linkUrl.trim(),
      isActive: form.isActive,
    };

    try {
      const url = editing ? `/api/platform/tutorials/${editing.id}` : '/api/platform/tutorials';
      const res = await fetch(url, {
        method: editing ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error ?? 'Error al guardar');
        return;
      }
      toast.success(editing ? 'Tutorial actualizado' : 'Tutorial creado');
      const updated = editing
        ? sortTutorials(tutorials.map((t) => (t.id === editing.id ? json.data : t)))
        : sortTutorials([...tutorials, json.data]);
      setTutorials(updated);
      resetForm();
    } catch {
      toast.error('Error de conexión');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm('¿Eliminar este tutorial?')) return;
    try {
      const res = await fetch(`/api/platform/tutorials/${id}`, { method: 'DELETE' });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error ?? 'Error al eliminar');
        return;
      }
      toast.success('Tutorial eliminado');
      const updated = sortTutorials(tutorials.filter((t) => t.id !== id)).map((t, index) => ({
        ...t,
        sortOrder: index + 1,
      }));
      setTutorials(updated);
      if (editing?.id === id) resetForm();
    } catch {
      toast.error('Error de conexión');
    }
  }

  function startEdit(tutorial: Tutorial) {
    setEditing(tutorial);
    setDraftTutorialId(tutorial.id);
    setFormOpen(true);
    setForm({
      title: tutorial.title,
      description: tutorial.description,
      imageUrl: tutorial.imageUrl,
      linkUrl: tutorial.linkUrl,
      isActive: tutorial.isActive,
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function handleDragStart(id: string) {
    setDragId(id);
  }

  function handleDragOver(e: React.DragEvent, id: string) {
    e.preventDefault();
    if (dragId && dragId !== id) setDragOverId(id);
  }

  function handleDrop(targetId: string) {
    if (!dragId || dragId === targetId || reordering) {
      setDragId(null);
      setDragOverId(null);
      return;
    }

    const next = reorderList(tutorials, dragId, targetId);
    setTutorials(next);
    setDragId(null);
    setDragOverId(null);
    void persistOrder(next);
  }

  const formTitle = editing ? 'Editar tutorial' : 'Nuevo tutorial';

  return (
    <div className="platform-bg min-h-screen min-h-[100dvh] text-white">
      <PlatformAdminHeader />

      <main className="mx-auto max-w-3xl px-4 py-6 pb-12 lg:max-w-4xl">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Tutoriales</h1>
          <p className="mt-1 text-sm text-white/50">
            Contenido visible para todas las barberías en su panel de administración
          </p>
        </div>

        <div className="glass-card mb-8 overflow-hidden rounded-2xl">
          <button
            type="button"
            onClick={() => setFormOpen((open) => !open)}
            className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left sm:px-6"
            aria-expanded={formOpen}
          >
            <div>
              <h2 className="text-lg font-semibold text-white/90">{formTitle}</h2>
              <p className="mt-0.5 text-xs text-white/45">
                {formOpen ? 'Completa los campos y guarda' : 'Haz clic para crear o editar un tutorial'}
              </p>
            </div>
            <ChevronIcon open={formOpen} />
          </button>

          {formOpen && (
            <form onSubmit={handleSubmit} className="space-y-4 border-t border-white/10 px-5 pb-5 pt-4 sm:px-6 sm:pb-6">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                  className="rounded border-white/20"
                />
                <span className="text-sm text-white/75">Visible para tenants</span>
              </label>

              <label className="block">
                <span className="mb-1 block text-sm font-medium text-white/75">Título</span>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="glass-input w-full rounded-xl px-3 py-2.5 text-sm"
                  maxLength={120}
                  required
                />
              </label>

              <label className="block">
                <span className="mb-1 block text-sm font-medium text-white/75">Descripción</span>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="glass-input min-h-[5rem] w-full rounded-xl px-3 py-2.5 text-sm"
                  maxLength={500}
                  required
                />
              </label>

              <label className="block">
                <span className="mb-1 block text-sm font-medium text-white/75">Enlace (YouTube u otro)</span>
                <input
                  type="url"
                  value={form.linkUrl}
                  onChange={(e) => setForm({ ...form, linkUrl: e.target.value })}
                  placeholder="https://www.youtube.com/watch?v=..."
                  className="glass-input w-full rounded-xl px-3 py-2.5 text-sm"
                  required
                />
              </label>

              <div className="space-y-2">
                <span className="block text-sm font-medium text-white/75">Imagen</span>
                <div className="flex flex-wrap gap-2">
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) void uploadImage(file, editing?.id ?? draftTutorialId ?? undefined);
                      e.target.value = '';
                    }}
                  />
                  <button
                    type="button"
                    disabled={uploading}
                    onClick={() => fileRef.current?.click()}
                    className="btn-glass rounded-xl px-4 py-2 text-sm font-medium disabled:opacity-50"
                  >
                    {uploading ? 'Subiendo…' : 'Subir imagen'}
                  </button>
                  <span className="self-center text-xs text-white/45">JPG, PNG o WebP · máx. 2 MB</span>
                </div>
                <input
                  type="url"
                  value={form.imageUrl}
                  onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
                  placeholder="O pega la URL de la imagen"
                  className="glass-input w-full rounded-xl px-3 py-2.5 text-sm"
                  required
                />
                {form.imageUrl && (
                  <div className="relative mt-2 h-36 w-full max-w-xs overflow-hidden rounded-xl border border-white/10">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={form.imageUrl} alt="Vista previa" className="h-full w-full object-cover" />
                  </div>
                )}
              </div>

              <div className="flex flex-wrap gap-2 pt-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-accent rounded-xl px-4 py-2.5 text-sm font-semibold disabled:opacity-50"
                >
                  {submitting ? 'Guardando…' : editing ? 'Guardar cambios' : 'Crear tutorial'}
                </button>
                {(editing || form.title || form.description || form.linkUrl || form.imageUrl) && (
                  <button
                    type="button"
                    onClick={resetForm}
                    className="btn-glass rounded-xl px-4 py-2.5 text-sm font-medium"
                  >
                    Cancelar
                  </button>
                )}
              </div>
            </form>
          )}
        </div>

        {error && (
          <div className="mb-4 rounded-2xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {error}
          </div>
        )}

        {loading ? (
          <div className="glass-card p-8 text-center text-white/50">Cargando tutoriales…</div>
        ) : tutorials.length === 0 ? (
          <div className="glass-card p-8 text-center text-white/50">
            Aún no hay tutoriales. Abre &quot;Nuevo tutorial&quot; arriba para crear el primero.
          </div>
        ) : (
          <>
            <p className="mb-3 text-xs text-white/45">
              Arrastra con el mouse para cambiar el orden. La numeración se actualiza sola.
              {reordering && <span className="ml-2 text-amber-300/80">Guardando orden…</span>}
            </p>
            <ul className="space-y-4">
              {tutorials.map((tutorial, index) => {
                const isDragging = dragId === tutorial.id;
                const isDragOver = dragOverId === tutorial.id && dragId !== tutorial.id;

                return (
                  <li
                    key={tutorial.id}
                    onDragOver={(e) => handleDragOver(e, tutorial.id)}
                    onDrop={() => handleDrop(tutorial.id)}
                    className={`glass-card overflow-hidden rounded-2xl transition-all ${
                      isDragging ? 'scale-[0.98] opacity-50' : ''
                    } ${isDragOver ? 'ring-2 ring-amber-500/50' : ''}`}
                  >
                    <div className="flex flex-col sm:flex-row">
                      <div className="flex items-stretch sm:contents">
                        <div
                          draggable={!reordering}
                          onDragStart={() => handleDragStart(tutorial.id)}
                          onDragEnd={() => {
                            setDragId(null);
                            setDragOverId(null);
                          }}
                          className="flex shrink-0 cursor-grab items-center justify-center border-b border-white/10 bg-white/[0.03] px-3 text-white/35 active:cursor-grabbing sm:w-10 sm:border-b-0 sm:border-r"
                          title="Arrastrar para reordenar"
                        >
                          <DragHandleIcon />
                        </div>
                        <div className="relative h-40 shrink-0 bg-white/5 sm:h-auto sm:w-44">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={tutorial.imageUrl}
                            alt=""
                            className="h-full w-full object-cover sm:absolute sm:inset-0"
                            draggable={false}
                          />
                          <span className="absolute left-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-amber-500/90 text-sm font-bold text-amber-950">
                            {index + 1}
                          </span>
                        </div>
                      </div>
                      <div className="flex min-w-0 flex-1 flex-col p-4 sm:p-5">
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <div className="min-w-0">
                            <h3 className="font-semibold text-white/95">{tutorial.title}</h3>
                            {!tutorial.isActive && (
                              <span className="mt-1 inline-block rounded-full bg-white/10 px-2 py-0.5 text-xs text-white/50">
                                Oculto
                              </span>
                            )}
                          </div>
                          <div className="flex shrink-0 gap-2">
                            <button
                              type="button"
                              onClick={() => startEdit(tutorial)}
                              className="btn-glass rounded-lg px-3 py-1.5 text-xs font-medium"
                            >
                              Editar
                            </button>
                            <button
                              type="button"
                              onClick={() => void handleDelete(tutorial.id)}
                              className="rounded-lg border border-red-400/30 bg-red-500/10 px-3 py-1.5 text-xs text-red-300 hover:bg-red-500/20"
                            >
                              Eliminar
                            </button>
                          </div>
                        </div>
                        <p className="mt-2 line-clamp-3 text-sm text-white/55">{tutorial.description}</p>
                        <a
                          href={tutorial.linkUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-3 truncate text-xs text-amber-300/80 hover:text-amber-200"
                        >
                          {tutorial.linkUrl}
                        </a>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </main>
    </div>
  );
}
