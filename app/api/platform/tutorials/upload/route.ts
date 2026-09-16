import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { uploadPlatformTutorialImage } from '@/lib/supabase/storage';
import { randomUUID } from 'crypto';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user || session.user.role !== 'super_admin') {
    return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file');
    const tutorialId = (formData.get('tutorialId') as string | null)?.trim() || randomUUID();

    if (!(file instanceof File) || file.size === 0) {
      return NextResponse.json({ success: false, error: 'Archivo requerido' }, { status: 400 });
    }

    const url = await uploadPlatformTutorialImage(tutorialId, file);
    return NextResponse.json({ success: true, data: { url, tutorialId } });
  } catch (error) {
    console.error('[platform/tutorials/upload POST]', error);
    const message = error instanceof Error ? error.message : 'Error al subir imagen';
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
