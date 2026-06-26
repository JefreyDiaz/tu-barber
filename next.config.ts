import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Default 10MB breaks video uploads (max 15MB). Use proxyClientMaxBodySize only (middlewareClientMaxBodySize is deprecated).
    proxyClientMaxBodySize: '20mb',
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
};

export default nextConfig;
