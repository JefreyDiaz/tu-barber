'use client';

import { signOut } from 'next-auth/react';

export function SignOutButton() {
  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/' });
  };

  return (
    <button
      onClick={handleSignOut}
      className="rounded-lg border border-neutral-300 bg-white px-3 py-1.5 text-sm text-neutral-600 transition-colors hover:bg-neutral-50 hover:text-neutral-800"
    >
      Cerrar sesión
    </button>
  );
}
