import { PLANS, normalizePlanId, type PlanId } from '@/lib/plans';

export type PlanUpgradeOffer = {
  currentPlan: PlanId;
  currentPlanName: string;
  nextPlan: PlanId;
  nextPlanName: string;
  nextPlanPrice: string;
  whatsappUrl: string | null;
  pricingUrl: string;
};

export function getNextPlanId(planId: PlanId): PlanId | null {
  if (planId === 'emprendedor') return 'negocio';
  if (planId === 'negocio') return 'cadena';
  return null;
}

/** Prakto / TuBarber — contacto upgrade de plan (Colombia +57). */
const DEFAULT_UPGRADE_WHATSAPP = '573116522507';

function getUpgradeWhatsAppDigits(): string {
  const fromEnv = process.env.PLAN_UPGRADE_WHATSAPP?.trim().replace(/\D/g, '');
  if (fromEnv) {
    return fromEnv.startsWith('57') && fromEnv.length >= 12 ? fromEnv : `57${fromEnv}`;
  }

  const fromPayment = process.env.SUBSCRIPTION_PAYMENT_PHONES?.trim();
  if (fromPayment) {
    const first = fromPayment.split(',')[0]?.trim().replace(/\D/g, '');
    if (first) {
      return first.startsWith('57') && first.length >= 12 ? first : `57${first}`;
    }
  }

  return DEFAULT_UPGRADE_WHATSAPP;
}

function buildPlatformPricingUrl(): string {
  const root = process.env.NEXT_PUBLIC_ROOT_DOMAIN?.trim();
  if (root && !root.includes('localhost')) {
    return `https://app.${root.replace(/^\.+/, '')}/#precios`;
  }
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return `${process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, '')}/#precios`;
  }
  return '/#precios';
}

export function getPlanUpgradeOffer(
  currentPlan: string,
  shopName: string
): PlanUpgradeOffer | null {
  const current = normalizePlanId(currentPlan);
  const next = getNextPlanId(current);
  if (!next) return null;

  const currentDef = PLANS[current];
  const nextDef = PLANS[next];
  const digits = getUpgradeWhatsAppDigits();
  const message = `Hola, la barbería ${shopName} quiere hacer upgrade al plan ${nextDef.name} (${nextDef.priceLabel}/mes). Actualmente tiene plan ${currentDef.name}.`;

  return {
    currentPlan: current,
    currentPlanName: currentDef.name,
    nextPlan: next,
    nextPlanName: nextDef.name,
    nextPlanPrice: nextDef.priceLabel,
    whatsappUrl: `https://wa.me/${digits}?text=${encodeURIComponent(message)}`,
    pricingUrl: buildPlatformPricingUrl(),
  };
}
