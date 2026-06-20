import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Providers } from "@/components/Providers";
import { PLATFORM_LOGO } from "@/lib/brand";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "TuBarber",
    template: "%s | TuBarber",
  },
  description: "Plataforma de reservas para barberías",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [{ url: PLATFORM_LOGO.icon, type: "image/png" }],
    shortcut: [{ url: PLATFORM_LOGO.icon, type: "image/png" }],
    apple: [{ url: PLATFORM_LOGO.icon, type: "image/png" }],
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
