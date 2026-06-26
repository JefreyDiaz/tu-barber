import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';

export default async function AparienciaLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const session = await auth();
  const role = session?.user?.role;

  if (role !== 'admin' && role !== 'dueno') {
    redirect('/admin/mis-reservas');
  }

  return <>{children}</>;
}
