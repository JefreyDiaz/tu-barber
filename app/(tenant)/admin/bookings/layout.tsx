import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';

export default async function BookingsLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();
  const role = session?.user?.role;
  
  // Admin y dueño pueden ver todas las reservas
  if (role !== 'admin' && role !== 'dueno') {
    redirect('/admin/mis-reservas');
  }

  return <>{children}</>;
}
