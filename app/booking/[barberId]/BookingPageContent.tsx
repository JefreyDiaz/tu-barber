'use client';

import { useState } from 'react';
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
        <h1 className="text-xl font-bold text-white mb-4 sm:text-2xl sm:mb-6 md:text-3xl md:mb-8">
          Seleccione una fecha y hora
        </h1>
      )}
      <BookingForm
        barberId={barberId}
        barberName={barberName}
        onSuccess={() => setShowTitle(false)}
      />
    </>
  );
}
