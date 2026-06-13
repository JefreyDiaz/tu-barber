import type { Metadata } from "next";

export const metadata: Metadata = {
  manifest: "/manifest-admin.webmanifest",
};

export default function LoginLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children;
}
