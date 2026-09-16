import { prisma } from '@/lib/prisma';
import { COLOMBIA_TZ } from '@/lib/date-utils';
import { getPlanDefinition, normalizePlanId } from '@/lib/plans';

const YEAR_MONTH = /^\d{4}-(0[1-9]|1[0-2])$/;

const BILLABLE_SUBSCRIPTION_STATUSES = new Set(['trialing', 'active', 'past_due']);

export function currentFinanceYearMonth(now = new Date()): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: COLOMBIA_TZ,
    year: 'numeric',
    month: '2-digit',
  }).formatToParts(now);
  const year = parts.find((p) => p.type === 'year')?.value ?? '1970';
  const month = parts.find((p) => p.type === 'month')?.value ?? '01';
  return `${year}-${month}`;
}

export function parseFinanceYearMonth(value: string | null | undefined, fallback?: string): string {
  const raw = String(value ?? '').slice(0, 7);
  if (YEAR_MONTH.test(raw)) return raw;
  return fallback ?? currentFinanceYearMonth();
}

export function shiftFinanceYearMonth(yearMonth: string, delta: number): string {
  const month = parseFinanceYearMonth(yearMonth);
  const [year, monthNum] = month.split('-').map(Number);
  const next = new Date(year, monthNum - 1 + delta, 1);
  return `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, '0')}`;
}

export function formatFinanceMonthLabel(yearMonth: string): string {
  const month = parseFinanceYearMonth(yearMonth);
  const [year, monthNum] = month.split('-').map(Number);
  const date = new Date(year, monthNum - 1, 1);
  return new Intl.DateTimeFormat('es-CO', { month: 'long', year: 'numeric', timeZone: COLOMBIA_TZ }).format(date);
}

export function financeMonthUtcRange(yearMonth: string): { start: Date; end: Date; startDate: string; endDate: string } {
  const month = parseFinanceYearMonth(yearMonth);
  const [year, monthNum] = month.split('-').map(Number);
  const lastDay = new Date(year, monthNum, 0).getDate();
  const startDate = `${month}-01`;
  const endDate = `${month}-${String(lastDay).padStart(2, '0')}`;

  // Colombia calendar day boundaries as UTC instants (UTC-5, no DST).
  const start = new Date(Date.UTC(year, monthNum - 1, 1, 5, 0, 0, 0));
  const end = new Date(Date.UTC(year, monthNum - 1, lastDay + 1, 4, 59, 59, 999));

  return { start, end, startDate, endDate };
}

function isBillableTenant(tenant: { status: string; subscriptionStatus: string }): boolean {
  return tenant.status === 'active' && BILLABLE_SUBSCRIPTION_STATUSES.has(tenant.subscriptionStatus);
}

export async function registerSubscriptionPayment(input: {
  tenantId: string;
  plan: string;
  periodEnd: Date;
  registeredById?: string | null;
  paidAt?: Date;
}) {
  const planId = normalizePlanId(input.plan);
  const amount = getPlanDefinition(planId).priceMonthly;

  return prisma.subscriptionPayment.create({
    data: {
      tenantId: input.tenantId,
      amount,
      plan: planId,
      periodEnd: input.periodEnd,
      registeredById: input.registeredById ?? null,
      paidAt: input.paidAt ?? new Date(),
    },
  });
}

export async function getPraktoFinanceReport(yearMonth?: string) {
  const month = parseFinanceYearMonth(yearMonth);
  const { start, end, startDate, endDate } = financeMonthUtcRange(month);

  const [tenants, payments] = await Promise.all([
    prisma.tenant.findMany({
      where: { status: { not: 'rejected' } },
      orderBy: { name: 'asc' },
      include: {
        onboarding: {
          select: { ownerName: true, ownerEmail: true, ownerPhone: true },
        },
      },
    }),
    prisma.subscriptionPayment.findMany({
      where: { paidAt: { gte: start, lte: end } },
      orderBy: [{ paidAt: 'desc' }, { createdAt: 'desc' }],
      include: {
        tenant: { select: { id: true, name: true, slug: true } },
      },
    }),
  ]);

  const tenantRows = tenants.map((tenant) => {
    const planId = normalizePlanId(tenant.plan);
    const plan = getPlanDefinition(planId);
    const periodEnd =
      tenant.subscriptionStatus === 'trialing'
        ? tenant.trialEndsAt
        : tenant.subscriptionEndsAt ?? tenant.trialEndsAt;

    return {
      id: tenant.id,
      slug: tenant.slug,
      name: tenant.name,
      plan: planId,
      planName: plan.name,
      priceMonthly: plan.priceMonthly,
      status: tenant.status,
      subscriptionStatus: tenant.subscriptionStatus,
      trialEndsAt: tenant.trialEndsAt?.toISOString() ?? null,
      subscriptionEndsAt: tenant.subscriptionEndsAt?.toISOString() ?? null,
      periodEnd: periodEnd?.toISOString() ?? null,
      ownerName: tenant.onboarding?.ownerName ?? null,
      ownerEmail: tenant.onboarding?.ownerEmail ?? null,
      ownerPhone: tenant.onboarding?.ownerPhone ?? null,
      billable: isBillableTenant(tenant),
    };
  });

  const billable = tenantRows.filter((t) => t.billable);
  const trialing = billable.filter((t) => t.subscriptionStatus === 'trialing');
  const paying = billable.filter((t) => t.subscriptionStatus === 'active' || t.subscriptionStatus === 'past_due');

  const expectedMrr = billable.reduce((sum, t) => sum + t.priceMonthly, 0);
  const collected = payments.reduce((sum, p) => sum + p.amount, 0);

  return {
    month,
    range: { start: startDate, end: endDate },
    timezone: COLOMBIA_TZ,
    currency: 'COP',
    summary: {
      expectedMrr,
      billableTenants: billable.length,
      trialingTenants: trialing.length,
      payingTenants: paying.length,
      collected,
      paymentCount: payments.length,
    },
    tenants: tenantRows,
    payments: payments.map((payment) => {
      const plan = getPlanDefinition(payment.plan);
      return {
        id: payment.id,
        tenantId: payment.tenantId,
        tenantName: payment.tenant.name,
        tenantSlug: payment.tenant.slug,
        amount: payment.amount,
        plan: payment.plan,
        planName: plan.name,
        paidAt: payment.paidAt.toISOString(),
        periodEnd: payment.periodEnd?.toISOString() ?? null,
      };
    }),
  };
}
