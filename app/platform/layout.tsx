import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';

export default async function PlatformLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
