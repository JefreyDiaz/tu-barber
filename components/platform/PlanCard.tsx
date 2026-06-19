'use client';

import Link from 'next/link';
import type { PlanDefinition, PlanId } from '@/lib/plans';
import { TRIAL_DAYS } from '@/lib/plans';

interface PlanCardProps {
  plan: PlanDefinition;
  selected?: boolean;
  onSelect?: (id: PlanId) => void;
  href?: string;
  compact?: boolean;
}

export default function PlanCard({ plan, selected, onSelect, href, compact }: PlanCardProps) {
  const inner = (
    <>
      {plan.popular && (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-amber-400 to-orange-500 px-3 py-0.5 text-xs font-semibold text-stone-900 shadow-lg">
          Más popular
        </span>
      )}

      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="text-lg font-bold text-white">{plan.name}</h3>
          <p className="text-sm text-white/50">{plan.tagline}</p>
        </div>
        {selected !== undefined && (
          <span
            className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${
              selected ? 'border-amber-400 bg-amber-400' : 'border-white/30'
            }`}
          >
            {selected && (
              <svg className="h-3 w-3 text-stone-900" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            )}
          </span>
        )}
      </div>

      <div className="mt-4 flex items-baseline gap-1">
        <span className="text-3xl font-bold text-gradient-gold">{plan.priceLabel}</span>
        <span className="text-sm text-white/40">/mes</span>
      </div>

      {plan.popular && (
        <p className="mt-2 text-xs font-medium text-amber-400/90">
          {TRIAL_DAYS} días gratis · acceso Pro completo
        </p>
      )}

      {!compact && (
        <ul className="mt-5 space-y-2.5">
          {plan.features.map((f) => (
            <li key={f} className="flex items-start gap-2 text-sm text-white/75">
              <svg className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              {f}
            </li>
          ))}
        </ul>
      )}

      {href && (
        <span className={`mt-6 block w-full rounded-2xl py-3 text-center text-sm font-semibold ${plan.popular ? 'btn-accent' : 'btn-glass'}`}>
          {plan.popular ? `Probar ${TRIAL_DAYS} días gratis` : 'Elegir plan'}
        </span>
      )}
    </>
  );

  const className = `glass-card relative p-5 transition-all duration-200 ${
    plan.popular ? 'scale-[1.02] glass-card-strong' : ''
  } ${selected ? 'plan-card-selected' : ''} ${onSelect ? 'cursor-pointer hover:border-white/20' : ''}`;

  if (href) {
    return (
      <Link href={href} className={className}>
        {inner}
      </Link>
    );
  }

  if (onSelect) {
    return (
      <button type="button" onClick={() => onSelect(plan.id)} className={`${className} w-full text-left`}>
        {inner}
      </button>
    );
  }

  return <div className={className}>{inner}</div>;
}
