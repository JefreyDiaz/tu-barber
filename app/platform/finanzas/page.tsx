import Link from 'next/link';
import PlatformAdminHeader from '@/components/platform/PlatformAdminHeader';
import {
  formatFinanceMonthLabel,
  getPraktoFinanceReport,
  parseFinanceYearMonth,
  shiftFinanceYearMonth,
} from '@/lib/integrations/prakto-finance';
import { formatPrice } from '@/lib/plans';

export const dynamic = 'force-dynamic';

function formatShortDate(iso: string): string {
  return new Intl.DateTimeFormat('es-CO', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'America/Bogota',
  }).format(new Date(iso));
}

function subscriptionLabel(status: string): string {
  const labels: Record<string, string> = {
    trialing: 'En prueba',
    active: 'Activa',
    past_due: 'Mora',
    none: 'Sin suscripción',
    canceled: 'Cancelada',
  };
  return labels[status] ?? status;
}

export default async function PlatformFinanzasPage({
  searchParams,
}: {
  searchParams: Promise<{ mes?: string }>;
}) {
  const params = await searchParams;
  const month = parseFinanceYearMonth(params?.mes);
  const prev = shiftFinanceYearMonth(month, -1);
  const next = shiftFinanceYearMonth(month, 1);

  let data;
  let loadError = '';

  try {
    data = await getPraktoFinanceReport(month);
  } catch {
    loadError = 'No se pudieron cargar las finanzas.';
  }

  const summary = data?.summary ?? {
    expectedMrr: 0,
    billableTenants: 0,
    trialingTenants: 0,
    payingTenants: 0,
    collected: 0,
    paymentCount: 0,
  };

  const collectionRate =
    summary.expectedMrr > 0 ? Math.min(100, Math.round((summary.collected / summary.expectedMrr) * 100)) : 0;

  const payments = data?.payments ?? [];
  const billableTenants = (data?.tenants ?? []).filter((t) => t.billable);

  const byPlan = billableTenants.reduce<
    Record<string, { planName: string; count: number; mrr: number }>
  >((acc, tenant) => {
    const current = acc[tenant.plan] ?? { planName: tenant.planName, count: 0, mrr: 0 };
    current.count += 1;
    current.mrr += tenant.priceMonthly;
    acc[tenant.plan] = current;
    return acc;
  }, {});

  const planBreakdown = Object.values(byPlan).sort((a, b) => b.mrr - a.mrr);
  const maxPlanMrr = planBreakdown[0]?.mrr ?? 1;

  const paidTenantIds = new Set(payments.map((p) => p.tenantId));
  const withoutPayment = billableTenants.filter(
    (t) => !paidTenantIds.has(t.id) && t.subscriptionStatus !== 'trialing'
  );

  return (
    <div className="platform-bg min-h-screen min-h-[100dvh] text-white">
      <PlatformAdminHeader />

      <main className="mx-auto max-w-3xl px-4 py-6 pb-12 lg:max-w-4xl">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold">Finanzas</h1>
            <p className="mt-1 text-sm text-white/50">
              Ingresos por suscripciones de barberías registradas en TuBarber
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Link href={`/platform/finanzas?mes=${prev}`} className="btn-glass rounded-full px-3 py-1.5 text-xs font-medium">
              ← {formatFinanceMonthLabel(prev)}
            </Link>
            <span className="rounded-full bg-amber-500/15 px-3 py-1.5 text-sm font-semibold text-amber-100 ring-1 ring-amber-500/30">
              {formatFinanceMonthLabel(month)}
            </span>
            <Link href={`/platform/finanzas?mes=${next}`} className="btn-glass rounded-full px-3 py-1.5 text-xs font-medium">
              {formatFinanceMonthLabel(next)} →
            </Link>
          </div>
        </div>

        {loadError ? (
          <div className="rounded-2xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {loadError}
          </div>
        ) : (
          <>
            <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
              {[
                {
                  label: 'MRR esperado',
                  value: formatPrice(summary.expectedMrr),
                  hint: `${summary.billableTenants} barberías facturables`,
                },
                {
                  label: 'Cobrado',
                  value: formatPrice(summary.collected),
                  hint: `${summary.paymentCount} pagos registrados`,
                },
                {
                  label: 'En prueba',
                  value: String(summary.trialingTenants),
                  hint: 'Aún no pagan cuota',
                },
                {
                  label: 'Pagando',
                  value: String(summary.payingTenants),
                  hint: 'Suscripción activa o mora',
                },
              ].map((stat) => (
                <div key={stat.label} className="glass-card px-4 py-4">
                  <p className="text-xs text-white/45">{stat.label}</p>
                  <p className="mt-1 text-xl font-bold text-gradient-gold sm:text-2xl">{stat.value}</p>
                  <p className="mt-1 text-[11px] text-white/40">{stat.hint}</p>
                </div>
              ))}
            </div>

            <div className="glass-card-strong mb-6 rounded-2xl p-5 sm:p-6">
              <div className="mb-2 flex items-end justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-white/80">Avance de cobro del mes</p>
                  <p className="text-xs text-white/45">
                    {formatPrice(summary.collected)} de {formatPrice(summary.expectedMrr)} esperados
                  </p>
                </div>
                <span className="text-2xl font-bold text-amber-300">{collectionRate}%</span>
              </div>
              <div className="h-3 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-amber-600 via-amber-400 to-amber-200 transition-all"
                  style={{ width: `${collectionRate}%` }}
                />
              </div>
              <p className="mt-3 text-xs text-white/40">
                Los cobros se registran desde Barberías → Registrar pago
              </p>
            </div>

            {planBreakdown.length > 0 && (
              <section className="glass-card mb-6 rounded-2xl p-5 sm:p-6">
                <h2 className="text-lg font-semibold text-white/90">MRR por plan</h2>
                <p className="mt-1 text-sm text-white/45">Barberías activas en prueba, activas o en mora</p>
                <ul className="mt-5 space-y-4">
                  {planBreakdown.map((item) => (
                    <li key={item.planName}>
                      <div className="mb-1.5 flex items-center justify-between text-sm">
                        <span className="font-medium text-white/85">
                          {item.planName}{' '}
                          <span className="font-normal text-white/45">({item.count})</span>
                        </span>
                        <span className="text-amber-200/90">{formatPrice(item.mrr)}</span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-white/10">
                        <div
                          className="h-full rounded-full bg-amber-500/70"
                          style={{ width: `${Math.max(8, (item.mrr / maxPlanMrr) * 100)}%` }}
                        />
                      </div>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            <div className="grid gap-6 lg:grid-cols-2">
              <section className="glass-card rounded-2xl p-5 sm:p-6">
                <h2 className="text-lg font-semibold text-white/90">Pagos del mes</h2>
                <p className="mt-1 text-sm text-white/45">{payments.length} movimientos</p>
                {payments.length === 0 ? (
                  <p className="mt-6 text-center text-sm text-white/40">
                    Aún no hay pagos registrados este mes.
                  </p>
                ) : (
                  <ul className="mt-4 space-y-3">
                    {payments.map((payment) => (
                      <li
                        key={payment.id}
                        className="flex items-start justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3"
                      >
                        <div className="min-w-0">
                          <p className="truncate font-medium text-white/90">{payment.tenantName}</p>
                          <p className="text-xs text-white/45">
                            {payment.planName} · {formatShortDate(payment.paidAt)}
                          </p>
                        </div>
                        <p className="shrink-0 text-sm font-semibold text-emerald-300">
                          +{formatPrice(payment.amount)}
                        </p>
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              <section className="glass-card rounded-2xl p-5 sm:p-6">
                <h2 className="text-lg font-semibold text-white/90">Pendientes de cobro</h2>
                <p className="mt-1 text-sm text-white/45">
                  Activas o en mora sin pago registrado este mes
                </p>
                {withoutPayment.length === 0 ? (
                  <p className="mt-6 text-center text-sm text-emerald-300/80">
                    Todas las barberías facturables tienen pago este mes.
                  </p>
                ) : (
                  <ul className="mt-4 space-y-3">
                    {withoutPayment.map((tenant) => (
                      <li
                        key={tenant.id}
                        className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="truncate font-medium text-white/90">{tenant.name}</p>
                            <p className="text-xs text-white/45">
                              {tenant.planName} · {subscriptionLabel(tenant.subscriptionStatus)}
                            </p>
                          </div>
                          <p className="shrink-0 text-sm text-amber-200/80">{formatPrice(tenant.priceMonthly)}</p>
                        </div>
                        <Link
                          href="/platform/tenants"
                          className="mt-2 inline-block text-xs text-amber-400/80 hover:text-amber-300"
                        >
                          Ir a Barberías →
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
