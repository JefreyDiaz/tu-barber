'use client';

import { useEffect, useState } from 'react';

/** Pixels covered by the mobile virtual keyboard (0 on desktop). */
export function useVisualViewportInset(): number {
  const [inset, setInset] = useState(0);

  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;

    const sync = () => {
      const covered = window.innerHeight - vv.height - vv.offsetTop;
      setInset(covered > 8 ? Math.round(covered) : 0);
    };

    sync();
    vv.addEventListener('resize', sync);
    vv.addEventListener('scroll', sync);
    return () => {
      vv.removeEventListener('resize', sync);
      vv.removeEventListener('scroll', sync);
    };
  }, []);

  return inset;
}
