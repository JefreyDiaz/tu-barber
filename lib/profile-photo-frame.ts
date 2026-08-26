/** Portrait frame for barber/owner photos on the public booking carousel. */
export const PROFILE_PHOTO_WIDTH = 350;
export const PROFILE_PHOTO_HEIGHT = 500;

export const PROFILE_PHOTO_ASPECT = PROFILE_PHOTO_WIDTH / PROFILE_PHOTO_HEIGHT;

/** Soft rounded corners (~12% of the shorter side). */
export const PROFILE_PHOTO_CORNER_RADIUS_RATIO = 0.12;

/** Slight bleed so the image fully covers the frame edge. */
export const PROFILE_PHOTO_COVER_BLEED = 1.04;

export function getProfilePhotoCornerRadius(width: number, height: number): number {
  return Math.min(width, height) * PROFILE_PHOTO_CORNER_RADIUS_RATIO;
}

/** Tailwind arbitrary radius matching export proportions. */
export const PROFILE_PHOTO_FRAME_CLASS = 'rounded-[12%]';
