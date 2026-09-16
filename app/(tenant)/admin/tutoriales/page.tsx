'use client';

import { useEffect, useState } from 'react';
import { ui } from '@/lib/admin-ui';
import { tenantApiUrl } from '@/lib/tenant/client-api';

type Tutorial = {
  id: string;
  sortOrder: number;
  title: string;
  description: string;
  imageUrl: string;
  linkUrl: string;
};

export default function AdminTutorialesPage() {
  const [tutorials, setTutorials] = useState<Tutorial[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(tenantApiUrl('/api/admin/tutorials'))
      .then(async (r) => {
        if (!r.ok) {
          const body = await r.json().catch(() => ({}));
          throw new Error(body.error ?? `Error ${r.status}`);
        }
        return r.json();
      })
      .then((json) => {
        if (json.success) setTutorials(json.data ?? []);
        else setError(json.error ?? 'Error al cargar tutoriales');
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className={ui.page}>
      <div>
        <h1 className={ui.title}>Tutoriales</h1>
        <p className={ui.subtitle}>Aprende a sacarle el máximo provecho a TuBarber</p>
      </div>

      {error && <div className={ui.alertError}>{error}</div>}

      {loading ? (
        <div className={ui.empty}>
          <div className={`${ui.spinner} mx-auto`} />
          <p className="mt-4 text-white/50">Cargando tutoriales…</p>
        </div>
      ) : tutorials.length === 0 ? (
        <div className={ui.empty}>
          <p className="text-white/50">Pronto publicaremos tutoriales aquí.</p>
        </div>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2">
          {tutorials.map((tutorial) => (
            <li key={tutorial.id}>
              <a
                href={tutorial.linkUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="group block overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] transition-colors hover:border-amber-500/30 hover:bg-white/[0.06]"
              >
                <div className="relative aspect-video bg-white/5">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={tutorial.imageUrl}
                    alt=""
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                  />
                  <span className="absolute left-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-amber-500/95 text-sm font-bold text-amber-950 shadow-lg">
                    {tutorial.sortOrder}
                  </span>
                  <span className="absolute bottom-3 right-3 rounded-full bg-black/60 px-2.5 py-1 text-xs font-medium text-white/90 backdrop-blur-sm">
                    Ver tutorial →
                  </span>
                </div>
                <div className="p-4">
                  <h2 className="font-semibold text-white/95 group-hover:text-amber-100">{tutorial.title}</h2>
                  <p className="mt-1.5 line-clamp-3 text-sm text-white/50">{tutorial.description}</p>
                </div>
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
