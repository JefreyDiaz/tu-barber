import CancelarContent from './CancelarContent';
import { requireTenant } from '@/lib/tenant/context';
import { scopedPrisma } from '@/lib/tenant/prisma-scoped';
import { notFound } from 'next/navigation';
interface CancelarPageProps {
  readonly params: Promise<{ bookingId: string }>;
}

export default async function CancelarPage({ params }: CancelarPageProps) {
  const { bookingId } = await params;
  const tenant = await requireTenant();

  const booking = await scopedPrisma(tenant.id).booking.findUnique({
    where: { id: bookingId },
  });
  if (!booking) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <CancelarContent bookingId={bookingId} />
      </div>
    </div>
  );
}
