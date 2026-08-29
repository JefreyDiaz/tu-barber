'use client';

import { useState } from 'react';
import Link from 'next/link';
import BookingForm from '@/components/BookingFormNew';

interface BookingPageContentProps {
  readonly barberId: string;
  readonly barberName: string;
}

export default function BookingPageContent({ barberId, barberName }: BookingPageContentProps) {
  const [showTitle, setShowTitle] = useState(true);

  return (
    <>
      {showTitle && (
        <div className="mb-5 text-center sm:mb-8">
          <p className="text-xs font-medium uppercase tracking-widest brand-accent-soft">
            Reservar con {barberName}
          </p>
          <h1 className="mt-2 text-2xl font-bold brand-text sm:text-3xl">
            Elige fecha y hora
          </h1>
        </div>
      )}
      <BookingForm
        barberId={barberId}
        barberName={barberName}
        onSuccess={() => setShowTitle(false)}
      />
    </>
  );
}
