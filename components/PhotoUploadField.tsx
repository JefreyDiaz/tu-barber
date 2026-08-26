'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import ProfilePhotoCropModal from '@/components/ProfilePhotoCropModal';
import { PROFILE_PHOTO_FRAME_CLASS } from '@/lib/profile-photo-frame';
import { tenantApiUrl } from '@/lib/tenant/client-api';
import { useToast } from '@/components/ToastProvider';

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
  const toast = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(currentPhoto ?? null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cropFile, setCropFile] = useState<File | null>(null);

  useEffect(() => {
    setPreview(currentPhoto ?? null);
  }, [currentPhoto]);

  async function uploadFile(file: File) {
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
      toast.success('Foto guardada correctamente');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al subir imagen';
      setError(msg);
      toast.error(msg);
    } finally {
      setUploading(false);
    }
  }

  function handleFileSelected(file: File) {
    setError(null);
    setCropFile(file);
  }

  async function handleCroppedPhoto(blob: Blob) {
    const file = new File([blob], 'profile-photo.png', { type: 'image/png' });
    await uploadFile(file);
  }

  return (
    <div>
      <p className="mb-2 block text-sm font-medium text-white/75">{label}</p>
      <div className="flex items-center gap-4">
        <div
          className={`relative aspect-[7/10] h-32 shrink-0 overflow-hidden border border-white/15 bg-white/5 ${PROFILE_PHOTO_FRAME_CLASS}`}
        >
          {preview ? (
            <Image
              key={preview}
              src={preview}
              alt=""
              fill
              className="object-contain object-bottom"
              unoptimized
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center px-1 text-center text-xs text-white/35">
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
              if (f) handleFileSelected(f);
              e.target.value = '';
            }}
          />
          <button
            type="button"
            disabled={uploading}
            onClick={() => inputRef.current?.click()}
            className="btn-glass rounded-xl px-3 py-2 text-sm font-medium disabled:opacity-50"
          >
            {uploading ? 'Subiendo...' : preview ? 'Cambiar foto' : 'Subir foto'}
          </button>
          <p className="mt-1 text-xs text-white/40">JPG, PNG o WebP · máx. 2 MB</p>
        </div>
      </div>
      {error && <p className="mt-2 text-sm text-red-300">{error}</p>}
      {cropFile && (
        <ProfilePhotoCropModal
          file={cropFile}
          onClose={() => setCropFile(null)}
          onConfirm={handleCroppedPhoto}
        />
      )}
    </div>
  );
}
