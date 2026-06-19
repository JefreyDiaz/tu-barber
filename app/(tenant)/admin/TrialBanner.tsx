'use client';

import { TRIAL_DAYS } from '@/lib/plans';

interface TrialBannerProps {
  daysLeft: number;
  selectedPlan: string;
}

export default function TrialBanner({ daysLeft, selectedPlan }: TrialBannerProps) {
  const urgent = daysLeft <= 3;

  return (
    <div
      className={`px-4 py-2.5 text-center text-sm ${
        urgent
          ? 'bg-amber-500 text-amber-950'
          : 'bg-gradient-to-r from-amber-500/90 to-orange-600/90 text-white'
      }`}
    >
      <span className="font-medium">
        Prueba Pro gratis — {daysLeft} {daysLeft === 1 ? 'día' : 'días'} restantes
      </span>
      <span className="mx-2 opacity-60">·</span>
      <span className="opacity-90">
        Después continúas con plan {selectedPlan === 'pro' ? 'Pro' : 'Básico'} ({TRIAL_DAYS} días de prueba)
      </span>
    </div>
  );
}
