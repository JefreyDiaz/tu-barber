import {
  PROFILE_PHOTO_ASPECT,
  PROFILE_PHOTO_COVER_BLEED,
  PROFILE_PHOTO_HEIGHT,
  PROFILE_PHOTO_WIDTH,
  getProfilePhotoCornerRadius,
} from '@/lib/profile-photo-frame';

export type ProfileCropTransform = {
  scale: number;
  offsetX: number;
  offsetY: number;
};

export type ProfileCropViewport = {
  width: number;
  height: number;
  frameWidth: number;
  frameHeight: number;
};

export const PROFILE_CROP_MAX_SCALE = 3;

export function getProfileCropViewport(containerWidth: number): ProfileCropViewport {
  const width = Math.min(Math.max(containerWidth - 32, 280), 360);
  const frameWidth = width * 0.58;
  const frameHeight = frameWidth / PROFILE_PHOTO_ASPECT;
  const height = Math.min(frameHeight + 56, 520);
  return { width, height, frameWidth, frameHeight };
}

export function getProfileCoverScale(
  imageWidth: number,
  imageHeight: number,
  frameWidth: number,
  frameHeight: number
): number {
  return (
    Math.max(frameWidth / imageWidth, frameHeight / imageHeight) *
    PROFILE_PHOTO_COVER_BLEED
  );
}

/** Minimum scale so the full image fits inside the portrait frame. */
export function getProfileMinCropScale(
  imageWidth: number,
  imageHeight: number,
  viewport: ProfileCropViewport
): number {
  const coverScale = getProfileCoverScale(
    imageWidth,
    imageHeight,
    viewport.frameWidth,
    viewport.frameHeight
  );
  const scaleForWidth = viewport.frameWidth / (imageWidth * coverScale);
  const scaleForHeight = viewport.frameHeight / (imageHeight * coverScale);
  const fitScale = Math.min(scaleForWidth, scaleForHeight);
  return Math.min(1, Math.max(0.12, fitScale));
}

export function clampProfileCropTransform(
  transform: ProfileCropTransform,
  imageWidth: number,
  imageHeight: number,
  viewport: ProfileCropViewport
): ProfileCropTransform {
  const minScale = getProfileMinCropScale(imageWidth, imageHeight, viewport);
  const scale = Math.min(PROFILE_CROP_MAX_SCALE, Math.max(minScale, transform.scale));
  const coverScale = getProfileCoverScale(
    imageWidth,
    imageHeight,
    viewport.frameWidth,
    viewport.frameHeight
  );
  const displayW = imageWidth * coverScale * scale;
  const displayH = imageHeight * coverScale * scale;

  const frameHalfW = viewport.frameWidth / 2;
  const frameHalfH = viewport.frameHeight / 2;

  const maxOffsetX = Math.abs(displayW / 2 - frameHalfW);
  const maxOffsetY = Math.abs(displayH / 2 - frameHalfH);

  return {
    scale,
    offsetX: Math.min(maxOffsetX, Math.max(-maxOffsetX, transform.offsetX)),
    offsetY: Math.min(maxOffsetY, Math.max(-maxOffsetY, transform.offsetY)),
  };
}

export function getProfileFrameRect(viewport: ProfileCropViewport): {
  x: number;
  y: number;
  width: number;
  height: number;
  radius: number;
} {
  const width = viewport.frameWidth;
  const height = viewport.frameHeight;
  return {
    x: (viewport.width - width) / 2,
    y: (viewport.height - height) / 2,
    width,
    height,
    radius: getProfilePhotoCornerRadius(width, height),
  };
}

function clipProfilePhotoFrame(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number
): void {
  const radius = getProfilePhotoCornerRadius(width, height);
  ctx.beginPath();
  ctx.roundRect(0, 0, width, height, radius);
  ctx.clip();
}

export async function exportProfilePhotoCrop(
  image: HTMLImageElement,
  transform: ProfileCropTransform,
  viewport: ProfileCropViewport
): Promise<Blob> {
  const clamped = clampProfileCropTransform(
    transform,
    image.naturalWidth,
    image.naturalHeight,
    viewport
  );

  const coverScale = getProfileCoverScale(
    image.naturalWidth,
    image.naturalHeight,
    viewport.frameWidth,
    viewport.frameHeight
  );

  const cx = viewport.width / 2;
  const cy = viewport.height / 2;
  const displayW = image.naturalWidth * coverScale * clamped.scale;
  const displayH = image.naturalHeight * coverScale * clamped.scale;
  const imgLeft = cx + clamped.offsetX - displayW / 2;
  const imgTop = cy + clamped.offsetY - displayH / 2;
  const frameLeft = cx - viewport.frameWidth / 2;
  const frameTop = cy - viewport.frameHeight / 2;

  const srcX = ((frameLeft - imgLeft) * image.naturalWidth) / displayW;
  const srcY = ((frameTop - imgTop) * image.naturalHeight) / displayH;
  const srcW = (viewport.frameWidth * image.naturalWidth) / displayW;
  const srcH = (viewport.frameHeight * image.naturalHeight) / displayH;

  const canvas = document.createElement('canvas');
  canvas.width = PROFILE_PHOTO_WIDTH;
  canvas.height = PROFILE_PHOTO_HEIGHT;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('No se pudo procesar la imagen');

  ctx.clearRect(0, 0, PROFILE_PHOTO_WIDTH, PROFILE_PHOTO_HEIGHT);
  ctx.save();
  clipProfilePhotoFrame(ctx, PROFILE_PHOTO_WIDTH, PROFILE_PHOTO_HEIGHT);
  ctx.drawImage(
    image,
    srcX,
    srcY,
    srcW,
    srcH,
    0,
    0,
    PROFILE_PHOTO_WIDTH,
    PROFILE_PHOTO_HEIGHT
  );
  ctx.restore();

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, 'image/png', 0.92)
  );
  if (!blob) throw new Error('No se pudo generar la foto');
  return blob;
}
