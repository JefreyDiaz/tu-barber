'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { signOut } from 'next-auth/react';
import { PLANS, getTrialDaysRemaining, normalizePlanId } from '@/lib/plans';
import PlatformLogo from '@/components/PlatformLogo';
import LogoFrame from '@/components/LogoFrame';
import { useToast } from '@/components/ToastProvider';
import { LOGO_PILL_CLASS, logoFrameClassName } from '@/lib/logo-frame';
import { buildTenantUrl, formatTenantHost } from '@/lib/tenant/urls';

interface TenantRow {
  id: string;
  slug: string;
  name: string;
  logoUrl: string | null;
  status: string;
  plan: string;
  subscriptionStatus: string;
  trialEndsAt: string | null;
  subscriptionEndsAt: string | null;
  customDomain: string | null;
  createdAt: string;
  updatedAt: string;
  owner: { username: string; name: string; isActive: boolean; email: string | null } | null;
  onboarding?: {
    ownerName: string;
    ownerEmail: string;
    ownerPhone: string;
    submittedAt: string;
    reviewedAt: string | null;
  } | null;
  _count: { users: number; bookings: number; services: number };
}

function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  return new Intl.DateTimeFormat('es-CO', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(iso));
}

function tenantUrls(slug: string) {
  return {
    public: buildTenantUrl(slug, '/'),
    login: buildTenantUrl(slug, '/login'),
  };
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    pending: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    active: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    suspended: 'bg-red-500/20 text-red-300 border-red-500/30',
    rejected: 'bg-white/10 text-white/50 border-white/10',
  };
  const labels: Record<string, string> = {
    pending: 'Pendiente',
    active: 'Activo',
    suspended: 'Suspendido',
    rejected: 'Rechazado',
  };
  return (
    <span className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${styles[status] ?? styles.pending}`}>
      {labels[status] ?? status}
    </span>
  );
}

function PlanBadge({ plan }: { plan: string }) {
  const planId = normalizePlanId(plan);
  const isHighlight = planId === 'negocio' || planId === 'cadena';
  return (
    <span
      className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${
        isHighlight
          ? 'border-amber-500/40 bg-amber-500/15 text-amber-300'
          : 'border-white/15 bg-white/5 text-white/60'
      }`}
    >
      {PLANS[planId]?.name ?? plan}
    </span>
  );
}

function CopyLinkButton({ href, label }: { href: string; label: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    await navigator.clipboard.writeText(href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <button
      type="button"
      onClick={copy}
      title="Copiar enlace"
      className="btn-glass rounded-xl px-3 py-2 text-xs font-medium"
    >
      {copied ? '✓ Copiado' : label}
    </button>
  );
}

function periodEndForTenant(tenant: TenantRow): string | null {
  if (tenant.subscriptionStatus === 'trialing') return tenant.trialEndsAt;
  if (tenant.subscriptionStatus === 'active' || tenant.subscriptionStatus === 'past_due') {
    return tenant.subscriptionEndsAt ?? tenant.trialEndsAt;
  }
  return null;
}

function periodEndLabel(subscriptionStatus: string): string {
  return subscriptionStatus === 'trialing' ? 'Prueba hasta' : 'Vence';
}

function TenantCardLogo({ name, logoUrl }: { name: string; logoUrl: string | null }) {
  const initial = name.trim().charAt(0).toUpperCase() || '?';

  if (logoUrl) {
    return (
      <LogoFrame
        src={logoUrl}
        alt={name}
        size="platform"
        className="shadow-[0_4px_12px_rgba(0,0,0,0.3)] ring-white/10"
      />
    );
  }

  return (
    <div
      className={`flex shrink-0 items-center justify-center bg-white/[0.06] ring-1 ring-white/10 ${LOGO_PILL_CLASS} ${logoFrameClassName('platform')}`}
      aria-hidden
    >
      <span className="text-base font-bold text-amber-400/85 sm:text-lg">{initial}</span>
    </div>
  );
}

function TenantCard({
  tenant,
  onAction,
  acting,
}: {
  tenant: TenantRow;
  onAction: (id: string, action: string) => void;
  acting: string | null;
}) {
  const urls = tenantUrls(tenant.slug);
  const trialDays =
    tenant.subscriptionStatus === 'trialing' && tenant.trialEndsAt
      ? getTrialDaysRemaining(new Date(tenant.trialEndsAt))
      : null;
  const periodEnd = periodEndForTenant(tenant);

  const subLabels: Record<string, string> = {
    none: 'Sin suscripción',
    trialing: 'Prueba Pro',
    active: 'Suscripción activa',
    past_due: 'Pago pendiente',
    canceled: 'Cancelada',
  };

  return (
    <article className="glass-card-strong relative overflow-hidden p-5 sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-lg font-bold text-white">{tenant.name}</h2>
            <StatusBadge status={tenant.status} />
            <PlanBadge plan={tenant.plan} />
            {tenant.subscriptionStatus === 'trialing' && trialDays !== null && (
              <span className="rounded-full bg-orange-500/20 px-2.5 py-0.5 text-xs font-medium text-orange-300">
                {trialDays} días de prueba
              </span>
            )}
          </div>

          <p className="mt-1 font-mono text-sm text-amber-400/80">
            {formatTenantHost(tenant.slug, tenant.customDomain)}
          </p>

          {(tenant.onboarding || tenant.owner) && (
            <div className="mt-3 space-y-1 text-sm text-white/60">
              <p>
                <span className="text-white/40">Dueño:</span>{' '}
                {tenant.onboarding?.ownerName ?? tenant.owner?.name}
                {tenant.owner && (
                  <span className="ml-2 font-mono text-xs text-white/45">@{tenant.owner.username}</span>
                )}
              </p>
              {tenant.onboarding?.ownerEmail && (
                <p>
                  <span className="text-white/40">Email:</span> {tenant.onboarding.ownerEmail}
                </p>
              )}
              {tenant.onboarding?.ownerPhone && (
                <p>
                  <span className="text-white/40">Tel:</span> {tenant.onboarding.ownerPhone}
                </p>
              )}
            </div>
          )}

          <div className="mt-4 grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
            <InfoCell label="Registro" value={formatDate(tenant.createdAt)} />
            <InfoCell
              label="Aprobación"
              value={formatDate(tenant.onboarding?.reviewedAt)}
            />
            <InfoCell
              label={periodEndLabel(tenant.subscriptionStatus)}
              value={periodEnd ? formatDate(periodEnd) : '—'}
            />
            <InfoCell
              label="Suscripción"
              value={subLabels[tenant.subscriptionStatus] ?? tenant.subscriptionStatus}
            />
          </div>

          <div className="mt-3 flex flex-wrap gap-3 text-xs text-white/45">
            <span>{tenant._count.users} usuarios</span>
            <span>·</span>
            <span>{tenant._count.bookings} reservas</span>
            <span>·</span>
            <span>{tenant._count.services} servicios</span>
          </div>
        </div>

        <div className="flex shrink-0 flex-wrap gap-2 sm:flex-col sm:items-stretch">
          {tenant.status === 'pending' && (
            <>
              <button
                type="button"
                disabled={acting === tenant.id}
                onClick={() => onAction(tenant.id, 'approve')}
                className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500 disabled:opacity-50"
              >
                Aprobar
              </button>
              <button
                type="button"
                disabled={acting === tenant.id}
                onClick={() => onAction(tenant.id, 'reject')}
                className="rounded-xl bg-red-600/90 px-4 py-2 text-sm font-semibold text-white hover:bg-red-500 disabled:opacity-50"
              >
                Rechazar
              </button>
            </>
          )}
          {tenant.status === 'active' && (
            <>
              {['trialing', 'active', 'past_due'].includes(tenant.subscriptionStatus) && (
                <button
                  type="button"
                  disabled={acting === tenant.id}
                  onClick={() => onAction(tenant.id, 'renew')}
                  className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500 disabled:opacity-50"
                >
                  Registrar pago
                </button>
              )}
              <button
                type="button"
                disabled={acting === tenant.id}
                onClick={() => onAction(tenant.id, 'suspend')}
                className="rounded-xl bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-500 disabled:opacity-50"
              >
                Suspender
              </button>
            </>
          )}
          {tenant.status === 'suspended' && (
            <button
              type="button"
              disabled={acting === tenant.id}
              onClick={() => onAction(tenant.id, 'reactivate')}
              className="btn-accent rounded-xl px-4 py-2 text-sm font-semibold disabled:opacity-50"
            >
              Reactivar
            </button>
          )}
        </div>
      </div>

      {tenant.status === 'active' && (
        <div className="mt-5 border-t border-white/10 pt-4">
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0 flex-1">
              <p className="mb-3 text-xs font-medium uppercase tracking-wider text-white/40">
                Enlaces de acceso
              </p>
              <div className="flex flex-wrap gap-2">
                <Link
                  href={buildTenantUrl(tenant.slug, '/')}
                  target="_blank"
                  className="btn-accent rounded-xl px-3 py-2 text-xs font-semibold"
                >
                  Ver sitio →
                </Link>
                <Link
                  href={buildTenantUrl(tenant.slug, '/login')}
                  target="_blank"
                  className="btn-glass rounded-xl px-3 py-2 text-xs font-medium"
                >
                  Login dueño
                </Link>
                <CopyLinkButton href={urls.public} label="Copiar sitio" />
                <CopyLinkButton href={urls.login} label="Copiar login" />
              </div>
              {tenant.owner && (
                <p className="mt-2 text-xs text-white/35">
                  Usuario dueño: <span className="font-mono text-white/50">{tenant.owner.username}</span>
                  {!tenant.owner.isActive && (
                    <span className="ml-2 text-amber-400">(inactivo hasta aprobación)</span>
                  )}
                </p>
              )}
            </div>
            <div className="shrink-0">
              <TenantCardLogo name={tenant.name} logoUrl={tenant.logoUrl} />
            </div>
          </div>
        </div>
      )}

      {tenant.status !== 'active' && (
        <div className="mt-4 flex justify-end border-t border-white/10 pt-4">
          <TenantCardLogo name={tenant.name} logoUrl={tenant.logoUrl} />
        </div>
      )}
    </article>
  );
}

function InfoCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-white/5 px-3 py-2">
      <p className="text-[10px] uppercase tracking-wider text-white/35">{label}</p>
      <p className="mt-0.5 font-medium text-white/80">{value}</p>
    </div>
  );
}

export default function PlatformTenantsPage() {
  const toast = useToast();
  const [tenants, setTenants] = useState<TenantRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'pending' | 'active' | 'trialing'>('all');

  const [loadError, setLoadError] = useState<string | null>(null);

  async function load() {
    setLoadError(null);
    try {
      const res = await fetch('/api/platform/tenants');
      const text = await res.text();
      if (!text.trim()) {
        throw new Error('Respuesta vacía del servidor');
      }
      const json = JSON.parse(text) as { success?: boolean; data?: TenantRow[]; error?: string };
      if (!res.ok || !json.success) {
        throw new Error(json.error ?? `Error ${res.status}`);
      }
      setTenants(json.data ?? []);
    } catch (err) {
      console.error('[platform/tenants]', err);
      setLoadError(
        err instanceof Error ? err.message : 'No se pudieron cargar las barberías'
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function action(id: string, actionName: string) {
    setActing(id);
    try {
      const res = await fetch(`/api/platform/tenants/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: actionName }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.success) {
        toast.error(json.error ?? 'No se pudo completar la acción');
        return;
      }
      toast.success('Cambios guardados correctamente');
      await load();
    } catch {
      toast.error('Error de conexión');
    } finally {
      setActing(null);
    }
  }

  const stats = useMemo(() => {
    return {
      total: tenants.length,
      active: tenants.filter((t) => t.status === 'active').length,
      pending: tenants.filter((t) => t.status === 'pending').length,
      trialing: tenants.filter((t) => t.subscriptionStatus === 'trialing').length,
    };
  }, [tenants]);

  const filtered = useMemo(() => {
    if (filter === 'all') return tenants;
    if (filter === 'pending') return tenants.filter((t) => t.status === 'pending');
    if (filter === 'active') return tenants.filter((t) => t.status === 'active');
    return tenants.filter((t) => t.subscriptionStatus === 'trialing');
  }, [tenants, filter]);

  const filters = [
    { id: 'all' as const, label: 'Todos', count: stats.total },
    { id: 'pending' as const, label: 'Pendientes', count: stats.pending },
    { id: 'active' as const, label: 'Activos', count: stats.active },
    { id: 'trialing' as const, label: 'En prueba', count: stats.trialing },
  ];

  return (
    <div className="platform-bg min-h-screen min-h-[100dvh] text-white">
      <header className="sticky top-0 z-50 border-b border-white/5 bg-stone-950/70 backdrop-blur-xl">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3 lg:max-w-4xl">
          <div>
            <PlatformLogo size="sm" href="/" />
            <p className="mt-1 text-xs text-white/45">Panel de plataforma</p>
          </div>
          <button
            type="button"
            onClick={() => signOut({ callbackUrl: '/platform/login' })}
            className="btn-glass rounded-full px-4 py-2 text-xs font-medium"
          >
            Cerrar sesión
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-6 pb-12 lg:max-w-4xl">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Barberías</h1>
          <p className="mt-1 text-sm text-white/50">Gestiona tenants, pruebas y accesos</p>
        </div>

        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: 'Total', value: stats.total },
            { label: 'Activos', value: stats.active },
            { label: 'Pendientes', value: stats.pending },
            { label: 'En prueba', value: stats.trialing },
          ].map((s) => (
            <div key={s.label} className="glass-card px-4 py-3 text-center">
              <p className="text-2xl font-bold text-gradient-gold">{s.value}</p>
              <p className="text-xs text-white/45">{s.label}</p>
            </div>
          ))}
        </div>

        <div className="mb-6 flex flex-wrap gap-2">
          {filters.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setFilter(f.id)}
              className={`rounded-full px-4 py-2 text-xs font-medium transition-colors ${
                filter === f.id
                  ? 'bg-amber-500/25 text-amber-200 ring-1 ring-amber-500/40'
                  : 'btn-glass'
              }`}
            >
              {f.label} ({f.count})
            </button>
          ))}
        </div>

        {loadError && (
          <div className="mb-4 rounded-2xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {loadError}
            <button
              type="button"
              onClick={() => {
                setLoading(true);
                void load();
              }}
              className="ml-3 underline hover:text-red-200"
            >
              Reintentar
            </button>
          </div>
        )}

        {loading ? (
          <div className="glass-card p-8 text-center text-white/50">Cargando barberías...</div>
        ) : filtered.length === 0 ? (
          <div className="glass-card p-8 text-center text-white/50">
            No hay barberías en este filtro.
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map((t) => (
              <TenantCard key={t.id} tenant={t} onAction={action} acting={acting} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
