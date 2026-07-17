import {
  TRIAL_DAYS,
  PLANS,
  type PlanId,
  getEffectivePlan,
  getTrialDaysRemaining,
  normalizePlanId,
} from '@/lib/plans';

export interface TenantSubscription {
  plan: string;
  subscriptionStatus: string;
  trialEndsAt: Date | null;
  subscriptionEndsAt?: Date | null;
}

export function startTrialEndDate(from: Date = new Date()): Date {
  const end = new Date(from);
  end.setDate(end.getDate() + TRIAL_DAYS);
  return end;
}

/** When the current access period ends (trial or paid month). */
export function getSubscriptionPeriodEnd(tenant: TenantSubscription): Date | null {
  if (tenant.subscriptionStatus === 'trialing') {
    return tenant.trialEndsAt;
  }
  if (
    tenant.subscriptionStatus === 'active' ||
    tenant.subscriptionStatus === 'past_due'
  ) {
    return tenant.subscriptionEndsAt ?? tenant.trialEndsAt;
  }
  return null;
}

/** Add one calendar month, keeping billing day when possible (Jan 31 → Feb 28). */
export function addOneCalendarMonth(date: Date): Date {
  const result = new Date(date);
  const day = result.getDate();
  result.setMonth(result.getMonth() + 1);
  if (result.getDate() !== day) {
    result.setDate(0);
  }
  return result;
}

/** @deprecated Prefer nextSubscriptionPeriodEndAfterPayment for manual renewals. */
export function nextSubscriptionPeriodEnd(from: Date = new Date()): Date {
  return addOneCalendarMonth(from);
}

/**
 * Next paid period end after registering payment.
 * Billing day is anchored to trialEndsAt / subscriptionEndsAt (e.g. always the 10th).
 */
export function nextSubscriptionPeriodEndAfterPayment(
  tenant: TenantSubscription,
  now: Date = new Date()
): Date {
  const currentEnd = getSubscriptionPeriodEnd(tenant) ?? tenant.trialEndsAt;
  if (!currentEnd) {
    return addOneCalendarMonth(now);
  }

  let next = addOneCalendarMonth(new Date(currentEnd));
  while (next.getTime() <= now.getTime()) {
    next = addOneCalendarMonth(next);
  }
  return next;
}

export function resolveTenantPlan(tenant: TenantSubscription): PlanId {
  return getEffectivePlan(tenant.plan, tenant.subscriptionStatus, tenant.trialEndsAt);
}

export function isTrialing(tenant: TenantSubscription): boolean {
  return (
    tenant.subscriptionStatus === 'trialing' &&
    !!tenant.trialEndsAt &&
    tenant.trialEndsAt > new Date()
  );
}

export function trialDaysLeft(tenant: TenantSubscription): number | null {
  if (!isTrialing(tenant)) return null;
  return getTrialDaysRemaining(tenant.trialEndsAt);
}

export function canUseCustomDomain(tenant: TenantSubscription): boolean {
  return PLANS[resolveTenantPlan(tenant)].limits.customDomain;
}

export function canUseOwnTwilio(tenant: TenantSubscription): boolean {
  return PLANS[resolveTenantPlan(tenant)].limits.ownTwilio;
}

export function maxBarbersForPlan(tenant: TenantSubscription): number {
  return PLANS[resolveTenantPlan(tenant)].limits.maxBarbers;
}

/** Negocio, Cadena y planes legacy con más de 1 barbero */
export function isMultiBarberPlan(planId: string): boolean {
  return PLANS[normalizePlanId(planId)].limits.maxBarbers > 1;
}

/** Subscribed plan (ignores trial uplift) — for billing display after trial. */
export function subscribedPlanId(tenant: TenantSubscription): PlanId {
  return normalizePlanId(tenant.plan);
}
