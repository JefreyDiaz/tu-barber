'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { tenantApiUrl } from '@/lib/tenant/client-api';
import { isVideoBackground } from '@/lib/tenant/branding';
import { BRANDING_UPLOAD_LIMITS } from '@/lib/supabase/storage';

function validateBrandingFile(file: File, kind: 'logo' | 'background'): string | null {
  const isVideo = file.type.startsWith('video/');
  if (kind === 'logo') {
    if (file.size > BRANDING_UPLOAD_LIMITS.logoMaxBytes) {
      return 'La imagen no puede superar 2 MB.';
    }
    return null;
  }
  if (isVideo && file.size > BRANDING_UPLOAD_LIMITS.backgroundVideoMaxBytes) {
    return 'El video no puede superar 15 MB. Comprime el archivo o usa una imagen.';
  }
  if (!isVideo && file.size > BRANDING_UPLOAD_LIMITS.backgroundImageMaxBytes) {
    return 'La imagen no puede superar 2 MB.';
  }
  return null;
}

interface BrandingUploadFieldProps {
  kind: 'logo' | 'background';
  currentUrl?: string | null;
  onUploaded: (url: string) => void | Promise<void>;
  label: string;
  hint: string;
  previewClassName?: string;
}

export default function BrandingUploadField({
  kind,
  currentUrl,
  onUploaded,
  label,
  hint,
  previewClassName,
}: BrandingUploadFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(currentUrl ?? null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setPreview(currentUrl ?? null);
  }, [currentUrl]);

  async function handleFile(file: File) {
    setError(null);
    setSaved(false);

    const validationError = validateBrandingFile(file, kind);
    if (validationError) {
      setError(validationError);
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('kind', kind);

      const res = await fetch(tenantApiUrl('/api/admin/upload/branding'), {
        method: 'POST',
        body: formData,
      });

      const text = await res.text();
      let json: { success?: boolean; error?: string; data?: { url: string } } = {};
      if (text) {
        try {
          json = JSON.parse(text) as typeof json;
        } catch {
          throw new Error('El servidor rechazó el archivo. Si es un video grande, reinicia el servidor de desarrollo.');
        }
      }

      if (!res.ok || !json.success || !json.data?.url) {
        throw new Error(json.error ?? 'Error al subir');
      }
      setPreview(json.data.url);
      await onUploaded(json.data.url);
      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al subir archivo');
    } finally {
      setUploading(false);
    }
  }

  const isVideo = preview ? isVideoBackground(preview) : false;

  return (
    <div>
      <p className="mb-2 block text-sm font-medium text-white/75">{label}</p>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
        <div
          className={`relative shrink-0 overflow-hidden rounded-2xl border border-white/15 bg-white/5 ${
            previewClassName ?? (kind === 'logo' ? 'h-24 w-48' : 'h-32 w-full max-w-md')
          }`}
        >
          {preview ? (
            isVideo ? (
              <video src={preview} className="h-full w-full object-cover" muted playsInline />
            ) : (
              <Image key={preview} src={preview} alt="" fill className="object-cover" unoptimized />
            )
          ) : (
            <div className="flex h-full min-h-[6rem] w-full items-center justify-center px-2 text-center text-xs text-white/35">
              Sin archivo
            </div>
          )}
        </div>
        <div>
          <input
            ref={inputRef}
            type="file"
            accept={
              kind === 'logo'
                ? 'image/jpeg,image/png,image/webp'
                : 'image/jpeg,image/png,image/webp,video/mp4,video/webm'
            }
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void handleFile(f);
              e.target.value = '';
            }}
          />
          <button
            type="button"
            disabled={uploading}
            onClick={() => inputRef.current?.click()}
            className="btn-glass rounded-xl px-3 py-2 text-sm font-medium disabled:opacity-50"
          >
            {uploading ? 'Subiendo...' : preview ? 'Cambiar archivo' : 'Subir archivo'}
          </button>
          <p className="mt-1 text-xs text-white/40">{hint}</p>
          {saved && !error && (
            <p className="mt-1 text-xs text-emerald-400/90">Archivo guardado correctamente</p>
          )}
        </div>
      </div>
      {error && <p className="mt-2 text-sm text-red-300">{error}</p>}
    </div>
  );
}
