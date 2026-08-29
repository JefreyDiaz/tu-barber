import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import HorariosNegocioContent from './HorariosNegocioContent';

export default async function HorariosPage() {
  const session = await auth();

  if (!session?.user || (session.user.role !== 'admin' && session.user.role !== 'dueno')) {
    redirect('/admin');
  }

  return <HorariosNegocioContent />;
}
