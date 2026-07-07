'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  clampLogoCropTransform,
  exportLogoPillCrop,
  getCoverScale,
  getLogoCropViewport,
  getPillRect,
  LOGO_CROP_MAX_SCALE,
  LOGO_CROP_MIN_SCALE,
  type LogoCropTransform,
} from '@/lib/logo-crop';

type LogoCropModalProps = {
  file: File;
  onClose: () => void;
  onConfirm: (blob: Blob) => void | Promise<void>;
};

export default function LogoCropModal({ file, onClose, onConfirm }: Readonly<LogoCropModalProps>) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [viewport, setViewport] = useState(() => getLogoCropViewport(360));
  const [transform, setTransform] = useState<LogoCropTransform>({
    scale: LOGO_CROP_MIN_SCALE,
    offsetX: 0,
    offsetY: 0,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const dragRef = useRef<{ x: number; y: number; offsetX: number; offsetY: number } | null>(null);

  useEffect(() => {
    setError(null);
    setImage(null);

    const url = URL.createObjectURL(file);
    setPreviewUrl(url);

    const img = new Image();
    img.decoding = 'async';
    let cancelled = false;

    img.onload = () => {
      if (cancelled) return;
      setImage(img);
      setError(null);
    };
    img.onerror = () => {
      if (cancelled) return;
      setError('No se pudo leer la imagen');
    };
    img.src = url;

    return () => {
      cancelled = true;
      URL.revokeObjectURL(url);
    };
  }, [file]);

  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;

    const update = () => {
      setViewport(getLogoCropViewport(el.clientWidth || window.innerWidth));
    };

    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const applyTransform = useCallback(
    (next: LogoCropTransform) => {
      if (!image) {
        setTransform(next);
        return;
      }
      setTransform(
        clampLogoCropTransform(next, image.naturalWidth, image.naturalHeight, viewport)
      );
    },
    [image, viewport]
  );

  useEffect(() => {
    if (image) {
      setTransform((current) =>
        clampLogoCropTransform(current, image.naturalWidth, image.naturalHeight, viewport)
      );
    }
  }, [image, viewport]);

  const coverScale = image
    ? getCoverScale(image.naturalWidth, image.naturalHeight, viewport.ovalWidth, viewport.ovalHeight)
    : 1;
  const displayW = image ? image.naturalWidth * coverScale * transform.scale : 0;
  const displayH = image ? image.naturalHeight * coverScale * transform.scale : 0;

  const maskId = 'logo-crop-mask';
  const pill = getPillRect(viewport);

  function handlePointerDown(e: React.PointerEvent<HTMLDivElement>) {
    if (!image) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    dragRef.current = {
      x: e.clientX,
      y: e.clientY,
      offsetX: transform.offsetX,
      offsetY: transform.offsetY,
    };
  }

  function handlePointerMove(e: React.PointerEvent<HTMLDivElement>) {
    const drag = dragRef.current;
    if (!drag) return;
    applyTransform({
      ...transform,
      offsetX: drag.offsetX + (e.clientX - drag.x),
      offsetY: drag.offsetY + (e.clientY - drag.y),
    });
  }

  function handlePointerUp(e: React.PointerEvent<HTMLDivElement>) {
    dragRef.current = null;
    e.currentTarget.releasePointerCapture(e.pointerId);
  }

  function handleWheel(e: React.WheelEvent<HTMLDivElement>) {
    e.preventDefault();
    if (!image) return;
    const delta = e.deltaY > 0 ? -0.08 : 0.08;
    applyTransform({
      ...transform,
      scale: transform.scale + delta,
    });
  }

  async function handleSave() {
    if (!image) return;
    setSaving(true);
    setError(null);
    try {
      const blob = await exportLogoPillCrop(image, transform, viewport);
      await onConfirm(blob);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar logo');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[120] flex items-end justify-center bg-black/80 p-0 sm:items-center sm:p-4">
      <div className="flex max-h-[100dvh] w-full max-w-lg flex-col overflow-hidden rounded-t-3xl border border-white/10 bg-stone-950 sm:rounded-3xl">
        <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-2 py-1 text-sm text-white/60 hover:text-white"
          >
            Cancelar
          </button>
          <div className="text-center">
            <p className="text-sm font-semibold text-white/90">Vista previa del logo</p>
            <p className="text-xs text-white/45">Arrastra y ajusta el zoom</p>
          </div>
          <button
            type="button"
            onClick={() => void handleSave()}
            disabled={!image || saving}
            className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-semibold text-white disabled:opacity-50"
          >
            {saving ? 'Guardando...' : 'Guardar'}
          </button>
        </div>

        <div ref={viewportRef} className="flex flex-1 flex-col items-center px-4 py-4">
          <div
            className="relative touch-none select-none overflow-hidden rounded-2xl bg-stone-900"
            style={{ width: viewport.width, height: viewport.height }}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            onWheel={handleWheel}
          >
            {previewUrl && image && (
              <img
                src={previewUrl}
                alt=""
                draggable={false}
                className="pointer-events-none absolute max-w-none"
                style={{
                  left: '50%',
                  top: '50%',
                  width: displayW,
                  height: displayH,
                  transform: `translate(calc(-50% + ${transform.offsetX}px), calc(-50% + ${transform.offsetY}px))`,
                }}
              />
            )}

            <svg
              className="pointer-events-none absolute inset-0 h-full w-full"
              viewBox={`0 0 ${viewport.width} ${viewport.height}`}
              aria-hidden
            >
              <defs>
                <mask id={maskId}>
                  <rect width="100%" height="100%" fill="white" />
                  <rect
                    x={pill.x}
                    y={pill.y}
                    width={pill.width}
                    height={pill.height}
                    rx={pill.radius}
                    ry={pill.radius}
                    fill="black"
                  />
                </mask>
              </defs>
              <rect
                width="100%"
                height="100%"
                fill="rgba(0,0,0,0.72)"
                mask={`url(#${maskId})`}
              />
              <rect
                x={pill.x}
                y={pill.y}
                width={pill.width}
                height={pill.height}
                rx={pill.radius}
                ry={pill.radius}
                fill="none"
                stroke="rgba(255,255,255,0.85)"
                strokeWidth="2"
              />
            </svg>

            {!image && !error && (
              <div className="absolute inset-0 flex items-center justify-center text-sm text-white/50">
                Cargando imagen...
              </div>
            )}
          </div>

          <div className="mt-4 w-full max-w-sm">
            <label className="mb-1 block text-xs text-white/45">Zoom</label>
            <input
              type="range"
              min={LOGO_CROP_MIN_SCALE}
              max={LOGO_CROP_MAX_SCALE}
              step={0.01}
              value={transform.scale}
              disabled={!image || saving}
              onChange={(e) =>
                applyTransform({ ...transform, scale: Number(e.target.value) })
              }
              className="w-full accent-blue-500"
            />
          </div>

          <p className="mt-3 text-center text-xs text-white/40">
            El logo se mostrará en forma de píldora horizontal en tu sitio público
          </p>
          {error && <p className="mt-2 text-center text-sm text-red-300">{error}</p>}
        </div>
      </div>
    </div>
  );
}
