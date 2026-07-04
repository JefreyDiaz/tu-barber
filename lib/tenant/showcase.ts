export const BARBERSHOPS_SECTION_ID = 'barberias';
export const BARBERSHOPS_SECTION_HASH = `#${BARBERSHOPS_SECTION_ID}`;

export interface ShowcaseBarbershop {
  slug: string;
  name: string;
  logoUrl: string | null;
  href: string;
}
