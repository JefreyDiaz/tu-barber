import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import HorariosContent from '../horarios/HorariosContent';

export default async function BloqueosPage() {
  const session = await auth();

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
