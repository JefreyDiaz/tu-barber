import type { CSSProperties, ReactNode } from 'react';
import type { TenantBranding } from '@/lib/tenant/branding';
import { brandingCssVars } from '@/lib/tenant/branding';

interface TenantSiteShellProps {
  readonly branding: TenantBranding;
  readonly children: ReactNode;
  readonly className?: string;
}

export default function TenantSiteShell({ branding, children, className = '' }: TenantSiteShellProps) {
  return (
    <div
      className={`tenant-site ${className}`.trim()}
      style={brandingCssVars(branding) as CSSProperties}
    >
      {children}
    </div>
  );
}
