'use client';

import { signOut } from 'next-auth/react';

export function SignOutButton() {
  return (
    <button
      type="button"
      onClick={() => signOut({ callbackUrl: '/' })}
      className="btn-glass rounded-full px-3 py-1.5 text-xs font-medium sm:text-sm"
    >
      Cerrar sesión
    </button>
  );
}
