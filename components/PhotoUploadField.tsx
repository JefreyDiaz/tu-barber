'use client';

import { useRef, useState } from 'react';
import Image from 'next/image';
import { tenantApiUrl } from '@/lib/tenant/client-api';

interface PhotoUploadFieldProps {
  userId: string;
  currentPhoto?: string | null;
  onUploaded: (url: string) => void;
  label?: string;
}

export default function PhotoUploadField({
  userId,
  currentPhoto,
  onUploaded,
  label = 'Foto de perfil',
}: PhotoUploadFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(currentPhoto ?? null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(file: File) {
    setError(null);
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('userId', userId);

      const res = await fetch(tenantApiUrl('/api/admin/upload/photo'), {
        method: 'POST',
        body: formData,
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error ?? 'Error al subir');
      }
      setPreview(json.data.url);
      onUploaded(json.data.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al subir imagen');
    } finally {
      setUploading(false);
    }
  }

  return (
    <div>
      <p className="mb-2 block text-sm font-medium text-neutral-700">{label}</p>
      <div className="flex items-center gap-4">
        <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-full border border-neutral-200 bg-neutral-100">
          {preview ? (
            <Image src={preview} alt="" fill className="object-cover" unoptimized />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-neutral-400 text-xs text-center px-1">
              Sin foto
            </div>
          )}
        </div>
        <div>
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleFile(f);
            }}
          />
          <button
            type="button"
            disabled={uploading}
            onClick={() => inputRef.current?.click()}
            className="rounded-lg border border-neutral-300 px-3 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50 disabled:opacity-50"
          >
            {uploading ? 'Subiendo...' : preview ? 'Cambiar foto' : 'Subir foto'}
          </button>
          <p className="mt-1 text-xs text-neutral-500">JPG, PNG o WebP · máx. 2 MB</p>
        </div>
      </div>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}
