import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export default async function UsersLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();
  
  // Verificar si estamos en modo setup (sin usuarios)
  const userCount = await prisma.user.count();
  const isSetupMode = userCount === 0;
  
  // Permitir acceso en modo setup, admin o dueño
  const role = session?.user?.role;
  if (!isSetupMode && role !== 'admin' && role !== 'dueno') {
    redirect('/admin/mis-reservas');
  }

  return <>{children}</>;
}
