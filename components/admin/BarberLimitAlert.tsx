'use client';

import type { PlanUpgradeOffer } from '@/lib/plans/upgrade';
import { ui } from '@/lib/admin-ui';

interface BarberLimitAlertProps {
  message: string;
  upgrade: PlanUpgradeOffer | null;
}

export default function BarberLimitAlert({ message, upgrade }: BarberLimitAlertProps) {
  return (
    <div
      className={`${ui.alertError} flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4`}
    >
      <p className="flex-1 text-sm leading-relaxed">{message}</p>
      {upgrade?.whatsappUrl && (
        <a
          href={upgrade.whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={`${ui.btnPrimary} shrink-0 self-start whitespace-nowrap sm:self-center`}
        >
          Actualizar a {upgrade.nextPlanName}
        </a>
      )}
    </div>
  );
}
