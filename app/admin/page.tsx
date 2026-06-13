import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export default async function AdminPage() {
  const session = await auth();
  const role = session?.user?.role;
  
  // Verificar si estamos en modo setup (sin usuarios)
  const userCount = await prisma.user.count();
  const isSetupMode = userCount === 0;
  
  // En modo setup o si es admin, ir a usuarios
  if (isSetupMode || role === 'admin') {
    redirect('/admin/users');
  }
  
  // Si es dueño, ir a reservas (tiene visión general)
  if (role === 'dueno') {
    redirect('/admin/bookings');
  }
  
  // Si es barbero, ir a sus reservas
  redirect('/admin/mis-reservas');
}
