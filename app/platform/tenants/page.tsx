'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { signOut } from 'next-auth/react';
import { PLANS, PLAN_LIST, getTrialDaysRemaining, normalizePlanId, getPaymentOverdueDays, type PlanId } from '@/lib/plans';
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

function PaymentPeriodBadge({ tenant, periodEnd }: { tenant: TenantRow; periodEnd: string | null }) {
  if (!periodEnd) return null;

  const endDate = new Date(periodEnd);
  const overdueDays = getPaymentOverdueDays(endDate);
  const formattedEnd = formatDate(periodEnd);

  if (overdueDays !== null) {
    const label =
      overdueDays === 0
        ? `Venció hoy (${formattedEnd})`
        : `${overdueDays} ${overdueDays === 1 ? 'día' : 'días'} de retraso`;
    return (
      <span
        className="rounded-full border border-red-500/40 bg-red-500/20 px-2.5 py-0.5 text-xs font-medium text-red-300"
        title={`Venció el ${formattedEnd}`}
      >
        {label}
      </span>
    );
  }

  if (tenant.subscriptionStatus === 'trialing') {
    const trialDays = getTrialDaysRemaining(endDate);
    if (trialDays !== null && trialDays > 0) {
      return (
        <span
          className="rounded-full bg-orange-500/20 px-2.5 py-0.5 text-xs font-medium text-orange-300"
          title={`Prueba hasta ${formattedEnd}`}
        >
          {trialDays} {trialDays === 1 ? 'día' : 'días'} de prueba
        </span>
      );
    }
  }

  return null;
}

function ImpersonateButton({ tenantId, disabled }: { tenantId: string; disabled?: boolean }) {
  const toast = useToast();
  const [loading, setLoading] = useState(false);

  async function handleImpersonate() {
    setLoading(true);
    try {
      const res = await fetch(`/api/platform/tenants/${tenantId}/impersonate`, { method: 'POST' });
      const data = (await res.json()) as { success?: boolean; redirectUrl?: string; error?: string };
      if (!res.ok || !data.redirectUrl) {
        toast.error(data.error ?? 'No se pudo iniciar suplantación');
        return;
      }
      window.location.href = data.redirectUrl;
    } catch {
      toast.error('Error de conexión');
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={() => void handleImpersonate()}
      disabled={disabled || loading}
      title="Entrar al admin del tenant en modo suplantación"
      className="btn-glass rounded-xl px-3 py-2 text-xs font-medium disabled:opacity-50"
    >
      {loading ? 'Abriendo…' : 'Suplantar'}
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

function ChevronToggle({ expanded }: { expanded: boolean }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      className={`h-5 w-5 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}
      aria-hidden
    >
      <path
        fillRule="evenodd"
        d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.94a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function PlanSelector({
  tenant,
  acting,
  onAction,
  value,
  onChange,
}: {
  tenant: TenantRow;
  acting: boolean;
  onAction: (id: string, action: string, options?: { plan?: string }) => void;
  value?: PlanId;
  onChange?: (plan: PlanId) => void;
}) {
  const [internalPlan, setInternalPlan] = useState(normalizePlanId(tenant.plan));
  const selectedPlan = value ?? internalPlan;
  const setSelectedPlan = onChange ?? setInternalPlan;
  const currentPlan = normalizePlanId(tenant.plan);
  const planChanged = selectedPlan !== currentPlan;
  const planDef = PLANS[selectedPlan];

  useEffect(() => {
    const next = normalizePlanId(tenant.plan);
    if (value === undefined) setInternalPlan(next);
  }, [tenant.plan, value]);

  if (tenant.status === 'rejected') return null;

  return (
    <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.03] p-4">
      <p className="text-xs font-medium uppercase tracking-wider text-white/40">Plan y suscripción</p>
      <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="min-w-0 flex-1">
          <label htmlFor={`plan-${tenant.id}`} className="mb-1 block text-xs text-white/50">
            Plan
          </label>
          <select
            id={`plan-${tenant.id}`}
            value={selectedPlan}
            onChange={(e) => setSelectedPlan(normalizePlanId(e.target.value))}
            disabled={acting}
            className="w-full rounded-xl border border-white/12 bg-white/6 px-3 py-2.5 text-sm text-white"
          >
            {PLAN_LIST.map((p) => (
              <option key={p.id} value={p.id} className="bg-stone-900">
                {p.name} — {p.priceLabel}/mes
              </option>
            ))}
          </select>
          <p className="mt-1.5 text-xs text-white/40">
            {planDef.tagline}
            {tenant.status === 'pending' && planChanged && (
              <span className="text-amber-400/90"> · Se aplicará al aprobar</span>
            )}
          </p>
        </div>
        {tenant.status !== 'pending' && (
          <button
            type="button"
            disabled={acting || !planChanged}
            onClick={() => onAction(tenant.id, 'changePlan', { plan: selectedPlan })}
            className="btn-glass shrink-0 rounded-xl px-4 py-2.5 text-sm font-medium disabled:opacity-40"
          >
            {acting ? 'Guardando...' : 'Actualizar plan'}
          </button>
        )}
      </div>
    </div>
  );
}

function TenantCard({
  tenant,
  onAction,
  acting,
  expanded,
  onToggle,
}: {
  tenant: TenantRow;
  onAction: (id: string, action: string, options?: { plan?: string }) => void;
  acting: boolean;
  expanded: boolean;
  onToggle: () => void;
}) {
  const [approvePlan, setApprovePlan] = useState(normalizePlanId(tenant.plan));
  const periodEnd = periodEndForTenant(tenant);
  const isActing = acting;

  useEffect(() => {
    setApprovePlan(normalizePlanId(tenant.plan));
  }, [tenant.plan]);

  const subLabels: Record<string, string> = {
    none: 'Sin suscripción',
    trialing: 'Prueba Pro',
    active: 'Suscripción activa',
    past_due: 'Pago pendiente',
    canceled: 'Cancelada',
  };

  return (
    <article className="glass-card-strong relative overflow-hidden p-5 sm:p-6">
      <div className="flex items-start gap-3">
        <button
          type="button"
          onClick={onToggle}
          className="min-w-0 flex-1 text-left"
          aria-expanded={expanded}
        >
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-lg font-bold text-white">{tenant.name}</h2>
            <StatusBadge status={tenant.status} />
            <PlanBadge plan={tenant.plan} />
            <PaymentPeriodBadge tenant={tenant} periodEnd={periodEnd} />
          </div>
          <p className="mt-1 font-mono text-sm text-amber-400/80">
            {formatTenantHost(tenant.slug, tenant.customDomain)}
          </p>
          {!expanded && (
            <p className="mt-2 text-xs text-white/45">
              {tenant._count.users} usuarios · {tenant._count.bookings} reservas ·{' '}
              {tenant._count.services} servicios
            </p>
          )}
        </button>
        <button
          type="button"
          onClick={onToggle}
          aria-label={expanded ? 'Contraer detalles' : 'Ver detalles'}
          aria-expanded={expanded}
          className="btn-glass flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white/70 hover:text-white"
        >
          <ChevronToggle expanded={expanded} />
        </button>
      </div>

      {expanded && (
        <>
          <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0 flex-1">
              {(tenant.onboarding || tenant.owner) && (
                <div className="space-y-1 text-sm text-white/60">
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
                    disabled={isActing}
                    onClick={() => onAction(tenant.id, 'approve', { plan: approvePlan })}
                    className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500 disabled:opacity-50"
                  >
                    Aprobar
                  </button>
                  <button
                    type="button"
                    disabled={isActing}
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
                      disabled={isActing}
                      onClick={() => onAction(tenant.id, 'renew')}
                      className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500 disabled:opacity-50"
                    >
                      Registrar pago
                    </button>
                  )}
                  <button
                    type="button"
                    disabled={isActing}
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
                  disabled={isActing}
                  onClick={() => onAction(tenant.id, 'reactivate')}
                  className="btn-accent rounded-xl px-4 py-2 text-sm font-semibold disabled:opacity-50"
                >
                  Reactivar
                </button>
              )}
            </div>
          </div>

          <PlanSelector
            tenant={tenant}
            acting={isActing}
            onAction={onAction}
            {...(tenant.status === 'pending'
              ? { value: approvePlan, onChange: setApprovePlan }
              : {})}
          />

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
                    <ImpersonateButton tenantId={tenant.id} disabled={isActing} />
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
        </>
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
  const [filter, setFilter] = useState<'all' | 'pending' | 'active' | 'trialing' | 'suspended'>(
    'all'
  );

  const [loadError, setLoadError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [search, setSearch] = useState('');

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

  async function action(id: string, actionName: string, options?: { plan?: string }) {
    setActing(id);
    try {
      const res = await fetch(`/api/platform/tenants/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: actionName, ...options }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.success) {
        toast.error(json.error ?? 'No se pudo completar la acción');
        return;
      }
      const messages: Record<string, string> = {
        changePlan: 'Plan actualizado correctamente',
        approve: 'Barbería aprobada correctamente',
        renew: 'Pago registrado correctamente',
      };
      toast.success(messages[actionName] ?? 'Cambios guardados correctamente');
      await load();
    } catch {
      toast.error('Error de conexión');
    } finally {
      setActing(null);
    }
  }

  const stats = useMemo(() => {
    const nonSuspended = tenants.filter((t) => t.status !== 'suspended');
    return {
      total: nonSuspended.length,
      active: tenants.filter((t) => t.status === 'active').length,
      pending: tenants.filter((t) => t.status === 'pending').length,
      trialing: nonSuspended.filter((t) => t.subscriptionStatus === 'trialing').length,
      suspended: tenants.filter((t) => t.status === 'suspended').length,
    };
  }, [tenants]);

  const filtered = useMemo(() => {
    let list: TenantRow[];
    if (filter === 'all') list = tenants.filter((t) => t.status !== 'suspended');
    else if (filter === 'pending') list = tenants.filter((t) => t.status === 'pending');
    else if (filter === 'active') list = tenants.filter((t) => t.status === 'active');
    else if (filter === 'suspended') list = tenants.filter((t) => t.status === 'suspended');
    else {
      list = tenants.filter(
        (t) => t.subscriptionStatus === 'trialing' && t.status !== 'suspended'
      );
    }

    const q = search.trim().toLowerCase();
    if (!q) return list;
    return list.filter((t) => t.name.toLowerCase().includes(q));
  }, [tenants, filter, search]);

  useEffect(() => {
    setExpandedId(null);
  }, [filter, search]);

  const filters = [
    { id: 'all' as const, label: 'Todos', count: stats.total },
    { id: 'pending' as const, label: 'Pendientes', count: stats.pending },
    { id: 'active' as const, label: 'Activos', count: stats.active },
    { id: 'trialing' as const, label: 'En prueba', count: stats.trialing },
    { id: 'suspended' as const, label: 'Suspendidos', count: stats.suspended },
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

        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
          <label className="relative min-w-0 flex-1 sm:max-w-sm">
            <span className="sr-only">Buscar barbería por nombre</span>
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nombre…"
              autoComplete="off"
              className="glass-input w-full rounded-full px-4 py-2.5 text-sm"
            />
          </label>
          <div className="flex flex-wrap justify-start gap-2 sm:justify-end">
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
            {search.trim()
              ? 'No hay barberías que coincidan con la búsqueda.'
              : 'No hay barberías en este filtro.'}
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map((t) => (
              <TenantCard
                key={t.id}
                tenant={t}
                onAction={action}
                acting={acting === t.id}
                expanded={expandedId === t.id}
                onToggle={() => setExpandedId((current) => (current === t.id ? null : t.id))}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
