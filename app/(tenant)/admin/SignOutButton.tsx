'use client';

import { signOut } from 'next-auth/react';
import { tenantHref } from '@/lib/tenant/client-api';

export function SignOutButton() {
  async function handleSignOut() {
    await signOut({ redirect: false });
    const loginPath = tenantHref('/login');
    globalThis.location.assign(`${globalThis.location.origin}${loginPath}`);
  }

  return (
    <button
      type="button"
      onClick={() => void handleSignOut()}
      className="btn-glass rounded-full px-3 py-1.5 text-xs font-medium sm:text-sm"
    >
      Cerrar sesión
    </button>
  );
}
