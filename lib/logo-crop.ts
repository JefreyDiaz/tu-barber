import {
  LOGO_COVER_BLEED,
  LOGO_EXPORT_HEIGHT,
  LOGO_EXPORT_WIDTH,
  LOGO_OVAL_ASPECT,
} from '@/lib/logo-frame';

export type LogoCropTransform = {
  scale: number;
  offsetX: number;
  offsetY: number;
};

export type LogoCropViewport = {
  width: number;
  height: number;
  ovalWidth: number;
  ovalHeight: number;
};

export const LOGO_CROP_MAX_SCALE = 3;

/** Minimum scale (relative to cover baseline) so the full image width fits in the pill. */
export function getMinCropScale(
  imageWidth: number,
  imageHeight: number,
  viewport: LogoCropViewport
): number {
  const coverScale = getCoverScale(
    imageWidth,
    imageHeight,
    viewport.ovalWidth,
    viewport.ovalHeight
  );
  const scaleForWidth = viewport.ovalWidth / (imageWidth * coverScale);
  const scaleForHeight = viewport.ovalHeight / (imageHeight * coverScale);
  const fitScale = Math.min(scaleForWidth, scaleForHeight);
  return Math.min(1, Math.max(0.12, fitScale));
}

export function getLogoCropViewport(width: number): LogoCropViewport {
  const cropWidth = Math.min(Math.max(width - 32, 280), 360);
  const cropHeight = Math.min(cropWidth * 1.05, 380);
  const ovalWidth = cropWidth * 0.88;
  const ovalHeight = ovalWidth / LOGO_OVAL_ASPECT;
  return {
    width: cropWidth,
    height: cropHeight,
    ovalWidth,
    ovalHeight,
  };
}

export function getCoverScale(
  imageWidth: number,
  imageHeight: number,
  ovalWidth: number,
  ovalHeight: number
): number {
  return (
    Math.max(ovalWidth / imageWidth, ovalHeight / imageHeight) * LOGO_COVER_BLEED
  );
}

export function clampLogoCropTransform(
  transform: LogoCropTransform,
  imageWidth: number,
  imageHeight: number,
  viewport: LogoCropViewport
): LogoCropTransform {
  const minScale = getMinCropScale(imageWidth, imageHeight, viewport);
  const scale = Math.min(LOGO_CROP_MAX_SCALE, Math.max(minScale, transform.scale));
  const coverScale = getCoverScale(imageWidth, imageHeight, viewport.ovalWidth, viewport.ovalHeight);
  const displayW = imageWidth * coverScale * scale;
  const displayH = imageHeight * coverScale * scale;

  const ovalHalfW = viewport.ovalWidth / 2;
  const ovalHalfH = viewport.ovalHeight / 2;

  const maxOffsetX = Math.abs(displayW / 2 - ovalHalfW);
  const maxOffsetY = Math.abs(displayH / 2 - ovalHalfH);

  return {
    scale,
    offsetX: Math.min(maxOffsetX, Math.max(-maxOffsetX, transform.offsetX)),
    offsetY: Math.min(maxOffsetY, Math.max(-maxOffsetY, transform.offsetY)),
  };
}

/** Clip context to a horizontal pill (stadium / capsule) shape. */
export function clipHorizontalPill(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number
): void {
  const radius = height / 2;
  ctx.beginPath();
  ctx.moveTo(radius, 0);
  ctx.lineTo(width - radius, 0);
  ctx.arc(width - radius, radius, radius, -Math.PI / 2, Math.PI / 2);
  ctx.lineTo(radius, height);
  ctx.arc(radius, radius, radius, Math.PI / 2, -Math.PI / 2);
  ctx.closePath();
  ctx.clip();
}

export function getPillRect(viewport: LogoCropViewport): {
  x: number;
  y: number;
  width: number;
  height: number;
  radius: number;
} {
  return {
    x: (viewport.width - viewport.ovalWidth) / 2,
    y: (viewport.height - viewport.ovalHeight) / 2,
    width: viewport.ovalWidth,
    height: viewport.ovalHeight,
    radius: viewport.ovalHeight / 2,
  };
}

export async function exportLogoPillCrop(
  image: HTMLImageElement,
  transform: LogoCropTransform,
  viewport: LogoCropViewport
): Promise<Blob> {
  const clamped = clampLogoCropTransform(
    transform,
    image.naturalWidth,
    image.naturalHeight,
    viewport
  );

  const coverScale = getCoverScale(
    image.naturalWidth,
    image.naturalHeight,
    viewport.ovalWidth,
    viewport.ovalHeight
  );

  const cx = viewport.width / 2;
  const cy = viewport.height / 2;
  const displayW = image.naturalWidth * coverScale * clamped.scale;
  const displayH = image.naturalHeight * coverScale * clamped.scale;
  const imgLeft = cx + clamped.offsetX - displayW / 2;
  const imgTop = cy + clamped.offsetY - displayH / 2;
  const ovalLeft = cx - viewport.ovalWidth / 2;
  const ovalTop = cy - viewport.ovalHeight / 2;

  const srcX = ((ovalLeft - imgLeft) * image.naturalWidth) / displayW;
  const srcY = ((ovalTop - imgTop) * image.naturalHeight) / displayH;
  const srcW = (viewport.ovalWidth * image.naturalWidth) / displayW;
  const srcH = (viewport.ovalHeight * image.naturalHeight) / displayH;

  const canvas = document.createElement('canvas');
  canvas.width = LOGO_EXPORT_WIDTH;
  canvas.height = LOGO_EXPORT_HEIGHT;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('No se pudo procesar la imagen');

  ctx.clearRect(0, 0, LOGO_EXPORT_WIDTH, LOGO_EXPORT_HEIGHT);
  clipHorizontalPill(ctx, LOGO_EXPORT_WIDTH, LOGO_EXPORT_HEIGHT);

  ctx.drawImage(
    image,
    srcX,
    srcY,
    srcW,
    srcH,
    -1,
    -1,
    LOGO_EXPORT_WIDTH + 2,
    LOGO_EXPORT_HEIGHT + 2
  );

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, 'image/png', 0.92)
  );
  if (!blob) throw new Error('No se pudo generar el logo');
  return blob;
}
