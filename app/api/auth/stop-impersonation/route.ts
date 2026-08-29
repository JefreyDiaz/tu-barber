import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { createRestoreToken } from '@/lib/auth/impersonation';

export const dynamic = 'force-dynamic';

export async function POST() {
  const session = await auth();

  if (!session?.user?.impersonating || !session.user.impersonatorId) {
    return NextResponse.json(
      { success: false, error: 'No estás en modo suplantación' },
      { status: 400 }
    );
  }

  const restoreToken = await createRestoreToken(session.user.impersonatorId);

  return NextResponse.json({ success: true, restoreToken });
}
