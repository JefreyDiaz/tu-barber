import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';

export default async function PlatformTutorialsLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  if (!session?.user || session.user.role !== 'super_admin') {
    redirect('/platform/login');
  }

  return <>{children}</>;
}
