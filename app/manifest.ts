import type { MetadataRoute } from "next";
import { PLATFORM_PWA_ICONS } from "@/lib/brand";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/client",
    name: "TuBarber",
    short_name: "TuBarber",
    description: "Plataforma de reservas para barberías",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#0c0c0c",
    theme_color: "#0c0c0c",
    icons: [...PLATFORM_PWA_ICONS],
  };
}
