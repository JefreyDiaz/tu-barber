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
}

export function startTrialEndDate(from: Date = new Date()): Date {
  const end = new Date(from);
  end.setDate(end.getDate() + TRIAL_DAYS);
  return end;
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
