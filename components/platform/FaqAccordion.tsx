'use client';

import { useState } from 'react';

interface FaqItem {
  q: string;
  a: string;
}

export default function FaqAccordion({ items }: { readonly items: readonly FaqItem[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  function toggle(index: number) {
    setOpenIndex((current) => (current === index ? null : index));
  }

  return (
    <div className="mt-6 space-y-3">
      {items.map((item, i) => {
        const isOpen = openIndex === i;
        return (
          <div key={item.q} className="glass-card p-4">
            <button
              type="button"
              onClick={() => toggle(i)}
              aria-expanded={isOpen}
              className="flex w-full cursor-pointer items-center justify-between gap-2 text-left font-medium"
            >
              {item.q}
              <span
                className={`shrink-0 text-white/40 transition-transform duration-200 ${isOpen ? 'rotate-45' : ''}`}
                aria-hidden
              >
                +
              </span>
            </button>
            {isOpen && (
              <p className="mt-3 text-sm leading-relaxed text-white/55">{item.a}</p>
            )}
          </div>
        );
      })}
    </div>
  );
}
