import type { NextConfig } from 'next';

const isDev = process.env.NODE_ENV === 'development';
const mediaHost = process.env.NEXT_PUBLIC_MEDIA_HOST ?? '';
const disableImageOptimization =
  process.env.NEXT_PUBLIC_DISABLE_IMAGE_OPTIMIZATION === 'true' ||
  mediaHost.includes('localhost') ||
  mediaHost.includes('127.0.0.1');

const nextConfig: NextConfig = {
  reactStrictMode: true,

  images: {
    formats: ['image/avif', 'image/webp'],
    unoptimized: isDev || disableImageOptimization,
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '8000',
        pathname: '/media/**',
      },
      {
        protocol: 'https',
        hostname: '**',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '8000',
      },
      {
        protocol: 'http',
        hostname: '127.0.0.1',
        port: '8000',
      },
    ],
  },

  experimental: {
    optimizePackageImports: ['lucide-react', 'framer-motion'],
  },
  turbopack: {},

};

export default nextConfig;
