export type PlanId = 'emprendedor' | 'negocio' | 'cadena';

export const PLAN_IDS = ['emprendedor', 'negocio', 'cadena'] as const satisfies readonly PlanId[];

export type SubscriptionStatus = 'none' | 'trialing' | 'active' | 'past_due' | 'canceled';

export const TRIAL_DAYS = 14;

export interface PlanDefinition {
  id: PlanId;
  name: string;
  tagline: string;
  priceMonthly: number;
  priceLabel: string;
  popular?: boolean;
  features: string[];
  limits: {
    maxBarbers: number;
    customDomain: boolean;
    ownTwilio: boolean;
    fullBranding: boolean;
    seo: boolean;
    galleryPhotos: number;
    prioritySupport: boolean;
  };
}

export const PLANS: Record<PlanId, PlanDefinition> = {
  emprendedor: {
    id: 'emprendedor',
    name: 'Emprendedor',
    tagline: 'Para el barbero que trabaja solo',
    priceMonthly: 59900,
    priceLabel: '$59.900',
    features: [
      '1 barbero',
      'Reservas online 24/7',
      'Subdominio tubarber.co',
      'Confirmaciones por WhatsApp (número de TuBarber)',
      'Logo y color de marca',
      'Panel de administración',
    ],
    limits: {
      maxBarbers: 1,
      customDomain: false,
      ownTwilio: false,
      fullBranding: false,
      seo: false,
      galleryPhotos: 3,
      prioritySupport: false,
    },
  },
  negocio: {
    id: 'negocio',
    name: 'Negocio',
    tagline: 'Tu barbería con equipo pequeño',
    priceMonthly: 109900,
    priceLabel: '$109.900',
    popular: true,
    features: [
      'Hasta 3 barberos',
      'Reservas online 24/7',
      'Subdominio tubarber.co',
      'Confirmaciones por WhatsApp (número de TuBarber)',
      'Logo y color de marca',
      'Panel de administración',
    ],
    limits: {
      maxBarbers: 3,
      customDomain: false,
      ownTwilio: false,
      fullBranding: true,
      seo: true,
      galleryPhotos: 12,
      prioritySupport: false,
    },
  },
  cadena: {
    id: 'cadena',
    name: 'Cadena',
    tagline: 'Para equipos que crecen',
    priceMonthly: 199900,
    priceLabel: '$199.900',
    features: [
      'Hasta 12 barberos',
      'Reservas online 24/7',
      'Dominio propio (mibarberia.com)',
      'Confirmaciones por WhatsApp (tu propio número)',
      'Logo y color de marca',
      'Panel de administración',
    ],
    limits: {
      maxBarbers: 12,
      customDomain: true,
      ownTwilio: true,
      fullBranding: true,
      seo: true,
      galleryPhotos: 20,
      prioritySupport: true,
    },
  },
};

export const PLAN_LIST: PlanDefinition[] = [PLANS.emprendedor, PLANS.negocio, PLANS.cadena];

const LEGACY_PLAN_MAP: Record<string, PlanId> = {
  basic: 'emprendedor',
  pro: 'negocio',
};

export function formatPrice(cop: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(cop);
}

export function isValidPlanId(value: string): value is PlanId {
  return value === 'emprendedor' || value === 'negocio' || value === 'cadena';
}

/** Map legacy DB values (basic/pro) to current plan ids. */
export function normalizePlanId(value: string): PlanId {
  if (isValidPlanId(value)) return value;
  return LEGACY_PLAN_MAP[value] ?? 'emprendedor';
}

export function getPlanDefinition(planId: string): PlanDefinition {
  return PLANS[normalizePlanId(planId)];
}

export function getPlanName(planId: string): string {
  return getPlanDefinition(planId).name;
}

/** Plan + trial + price line for onboarding / approval emails */
export function formatWelcomePlanSummary(planId: string): string {
  const plan = getPlanDefinition(planId);
  return `Plan ${plan.name} · ${TRIAL_DAYS} días gratis · Luego ${plan.priceLabel}/mes`;
}

export function getEffectivePlan(
  plan: string,
  _subscriptionStatus?: string,
  _trialEndsAt?: Date | null | undefined
): PlanId {
  return normalizePlanId(plan);
}

export function getTrialDaysRemaining(trialEndsAt: Date | null | undefined): number | null {
  if (!trialEndsAt) return null;
  const diff = trialEndsAt.getTime() - Date.now();
  if (diff <= 0) return 0;
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

/** Days since period end (trial or subscription). Null if not overdue. */
export function getPaymentOverdueDays(periodEnd: Date | null | undefined): number | null {
  if (!periodEnd) return null;
  const diff = Date.now() - periodEnd.getTime();
  if (diff <= 0) return null;
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}
