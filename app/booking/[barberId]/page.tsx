import BookingPageContent from './BookingPageContent';
import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';

interface BookingPageProps {
  readonly params: Promise<{ barberId: string }>;
}

export default async function BookingPage({ params }: BookingPageProps) {
  const { barberId } = await params;
  
  // Buscar el usuario barbero o dueño por ID
  const barber = await prisma.user.findUnique({
    where: { 
      id: barberId,
      role: { in: ['barbero', 'dueno'] },
      isActive: true,
    },
    select: {
      id: true,
      name: true,
    },
  });

  if (!barber) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <div className="container mx-auto px-3 py-4 sm:px-4 sm:py-6 md:py-8">
        <div className="max-w-4xl mx-auto w-full min-w-0">
          <BookingPageContent barberId={barberId} barberName={barber.name} />
        </div>
      </div>
    </div>
  );
}
