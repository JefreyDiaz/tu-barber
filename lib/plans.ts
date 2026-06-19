export type PlanId = 'basic' | 'pro';

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
    ownManyChat: boolean;
    fullBranding: boolean;
    seo: boolean;
    galleryPhotos: number;
  };
}

export const PLANS: Record<PlanId, PlanDefinition> = {
  basic: {
    id: 'basic',
    name: 'Básico',
    tagline: 'Ideal para empezar',
    priceMonthly: 39900,
    priceLabel: '$39.900',
    features: [
      'Hasta 3 barberos',
      'Reservas online 24/7',
      'Subdominio tubarber.com',
      'WhatsApp con TuBarber',
      'Logo y color de marca',
      'Panel de administración',
    ],
    limits: {
      maxBarbers: 3,
      customDomain: false,
      ownManyChat: false,
      fullBranding: false,
      seo: false,
      galleryPhotos: 3,
    },
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    tagline: 'Tu barbería profesional',
    priceMonthly: 89900,
    priceLabel: '$89.900',
    popular: true,
    features: [
      'Hasta 10 barberos',
      'Dominio propio (mibarberia.com)',
      'ManyChat con tu cuenta',
      'Landing personalizada completa',
      'SEO y preview en WhatsApp',
      'Recordatorios ilimitados',
      'Sin marca TuBarber',
    ],
    limits: {
      maxBarbers: 10,
      customDomain: true,
      ownManyChat: true,
      fullBranding: true,
      seo: true,
      galleryPhotos: 12,
    },
  },
};

export const PLAN_LIST: PlanDefinition[] = [PLANS.basic, PLANS.pro];

export function formatPrice(cop: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(cop);
}

export function isValidPlanId(value: string): value is PlanId {
  return value === 'basic' || value === 'pro';
}

export function getEffectivePlan(
  plan: string,
  subscriptionStatus: string,
  trialEndsAt: Date | null | undefined
): PlanId {
  if (subscriptionStatus === 'trialing' && trialEndsAt && trialEndsAt > new Date()) {
    return 'pro';
  }
  return isValidPlanId(plan) ? plan : 'basic';
}

export function getTrialDaysRemaining(trialEndsAt: Date | null | undefined): number | null {
  if (!trialEndsAt) return null;
  const diff = trialEndsAt.getTime() - Date.now();
  if (diff <= 0) return 0;
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}
