import { createClient } from '@supabase/supabase-js';

const BUCKET = process.env.SUPABASE_STORAGE_BUCKET ?? 'barber-photos';

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error('Supabase Storage no configurado (NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)');
  }
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const MAX_BYTES = 2 * 1024 * 1024;

export async function uploadBarberPhoto(
  tenantId: string,
  userId: string,
  file: File
): Promise<string> {
  if (!ALLOWED_TYPES.has(file.type)) {
    throw new Error('Formato no permitido. Usa JPG, PNG o WebP.');
  }
  if (file.size > MAX_BYTES) {
    throw new Error('La imagen no puede superar 2 MB.');
  }

  const ext = file.type === 'image/png' ? 'png' : file.type === 'image/webp' ? 'webp' : 'jpg';
  const path = `${tenantId}/${userId}.${ext}`;

  const supabase = getSupabaseAdmin();
  const buffer = Buffer.from(await file.arrayBuffer());

  const { error } = await supabase.storage.from(BUCKET).upload(path, buffer, {
    contentType: file.type,
    upsert: true,
  });

  if (error) {
    throw new Error(error.message);
  }

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return withCacheBuster(data.publicUrl);
}

export { BUCKET };

const BRANDING_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const BRANDING_VIDEO_TYPES = new Set(['video/mp4', 'video/webm']);
const BRANDING_IMAGE_MAX = 2 * 1024 * 1024;
const BRANDING_VIDEO_MAX = 15 * 1024 * 1024;

export const BRANDING_UPLOAD_LIMITS = {
  logoMaxBytes: BRANDING_IMAGE_MAX,
  backgroundImageMaxBytes: BRANDING_IMAGE_MAX,
  backgroundVideoMaxBytes: BRANDING_VIDEO_MAX,
} as const;

const BRANDING_EXTENSIONS = ['png', 'webp', 'jpg', 'mp4', 'webm'] as const;

function withCacheBuster(publicUrl: string): string {
  const sep = publicUrl.includes('?') ? '&' : '?';
  return `${publicUrl}${sep}v=${Date.now()}`;
}

async function removeStaleBrandingFiles(
  supabase: ReturnType<typeof getSupabaseAdmin>,
  tenantId: string,
  kind: 'logo' | 'background',
  keepExt: string
) {
  const stalePaths = BRANDING_EXTENSIONS.filter((ext) => ext !== keepExt).map(
    (ext) => `${tenantId}/branding/${kind}.${ext}`
  );
  await supabase.storage.from(BUCKET).remove(stalePaths);
}

export async function uploadTenantBrandingAsset(
  tenantId: string,
  kind: 'logo' | 'background',
  file: File
): Promise<string> {
  const isLogo = kind === 'logo';
  const allowed = isLogo ? BRANDING_IMAGE_TYPES : new Set([...BRANDING_IMAGE_TYPES, ...BRANDING_VIDEO_TYPES]);
  const maxBytes = isLogo ? BRANDING_IMAGE_MAX : BRANDING_VIDEO_MAX;

  if (!allowed.has(file.type)) {
    throw new Error(
      isLogo
        ? 'Formato no permitido. Usa JPG, PNG o WebP.'
        : 'Formato no permitido. Usa JPG, PNG, WebP, MP4 o WebM.'
    );
  }
  if (file.size > maxBytes) {
    throw new Error(isLogo ? 'La imagen no puede superar 2 MB.' : 'El archivo no puede superar 15 MB.');
  }

  const ext =
    file.type === 'image/png'
      ? 'png'
      : file.type === 'image/webp'
        ? 'webp'
        : file.type === 'video/webm'
          ? 'webm'
          : file.type === 'video/mp4'
            ? 'mp4'
            : 'jpg';

  const path = `${tenantId}/branding/${kind}.${ext}`;
  const supabase = getSupabaseAdmin();
  const buffer = Buffer.from(await file.arrayBuffer());

  const { error } = await supabase.storage.from(BUCKET).upload(path, buffer, {
    contentType: file.type,
    upsert: true,
  });

  if (error) {
    throw new Error(error.message);
  }

  await removeStaleBrandingFiles(supabase, tenantId, kind, ext);

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return withCacheBuster(data.publicUrl);
}
