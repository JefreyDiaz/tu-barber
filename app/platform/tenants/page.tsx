'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface TenantRow {
  id: string;
  slug: string;
  name: string;
  status: string;
  plan: string;
  subscriptionStatus?: string;
  trialEndsAt?: string | null;
  createdAt: string;
  onboarding?: { ownerName: string; ownerEmail: string; ownerPhone: string } | null;
  _count: { users: number; bookings: number };
}

export default function PlatformTenantsPage() {
  const [tenants, setTenants] = useState<TenantRow[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    const res = await fetch('/api/platform/tenants');
    const json = await res.json();
    if (json.success) setTenants(json.data);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function action(id: string, actionName: string) {
    await fetch(`/api/platform/tenants/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: actionName }),
    });
    load();
  }

  return (
    <div className="min-h-screen bg-neutral-100">
      <header className="border-b bg-white px-4 py-3">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <h1 className="font-semibold text-neutral-900">TuBarber — Tenants</h1>
          <Link href="/" className="text-sm text-neutral-500 hover:text-neutral-700">
            Salir
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8">
        {loading ? (
          <p className="text-neutral-500">Cargando...</p>
        ) : tenants.length === 0 ? (
          <p className="text-neutral-500">No hay tenants registrados.</p>
        ) : (
          <div className="space-y-4">
            {tenants.map((t) => (
              <div key={t.id} className="rounded-lg border border-neutral-200 bg-white p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <h2 className="font-semibold text-neutral-900">{t.name}</h2>
                    <p className="text-sm text-neutral-500">
                      {t.slug}.tubarber.com · {t.status} · plan {t.plan}
                      {(t as TenantRow).subscriptionStatus === 'trialing' && ' · en prueba'}
                    </p>
                    {t.onboarding && (
                      <p className="mt-1 text-sm text-neutral-600">
                        {t.onboarding.ownerName} — {t.onboarding.ownerEmail} — {t.onboarding.ownerPhone}
                      </p>
                    )}
                    <p className="text-xs text-neutral-400 mt-1">
                      {t._count.users} usuarios · {t._count.bookings} reservas
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {t.status === 'pending' && (
                      <>
                        <button
                          onClick={() => action(t.id, 'approve')}
                          className="rounded bg-green-600 px-3 py-1.5 text-sm text-white hover:bg-green-700"
                        >
                          Aprobar
                        </button>
                        <button
                          onClick={() => action(t.id, 'reject')}
                          className="rounded bg-red-600 px-3 py-1.5 text-sm text-white hover:bg-red-700"
                        >
                          Rechazar
                        </button>
                      </>
                    )}
                    {t.status === 'active' && (
                      <button
                        onClick={() => action(t.id, 'suspend')}
                        className="rounded bg-amber-600 px-3 py-1.5 text-sm text-white hover:bg-amber-700"
                      >
                        Suspender
                      </button>
                    )}
                    {t.status === 'suspended' && (
                      <button
                        onClick={() => action(t.id, 'reactivate')}
                        className="rounded bg-blue-600 px-3 py-1.5 text-sm text-white hover:bg-blue-700"
                      >
                        Reactivar
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
