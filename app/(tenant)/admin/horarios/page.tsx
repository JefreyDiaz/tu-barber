import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import HorariosContent from './HorariosContent';

export default async function HorariosPage() {
  const session = await auth();

  // Solo barberos y dueños pueden acceder
  if (!session?.user || (session.user.role !== 'barbero' && session.user.role !== 'dueno')) {
    redirect('/admin');
  }

  return (
    <HorariosContent
      barberId={session.user.id!}
      barberName={session.user.name || 'Barbero'}
    />
  );
}
