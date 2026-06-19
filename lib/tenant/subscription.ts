import { TRIAL_DAYS, type PlanId, getEffectivePlan, getTrialDaysRemaining } from '@/lib/plans';

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
  return resolveTenantPlan(tenant) === 'pro';
}

export function canUseOwnManyChat(tenant: TenantSubscription): boolean {
  return resolveTenantPlan(tenant) === 'pro';
}

export function maxBarbersForPlan(tenant: TenantSubscription): number {
  const plan = resolveTenantPlan(tenant);
  return plan === 'pro' ? 10 : 3;
}
