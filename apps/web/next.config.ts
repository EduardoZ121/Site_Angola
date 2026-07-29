import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: [
    '@kuteka/ui',
    '@kuteka/shared',
    '@kuteka/types',
    '@kuteka/validation',
    '@kuteka/database',
    '@kuteka/auth',
  ],
  images: {
    remotePatterns: [],
  },
  poweredByHeader: false,
};

export default nextConfig;
