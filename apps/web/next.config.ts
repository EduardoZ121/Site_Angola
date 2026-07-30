import type { NextConfig } from 'next';

const isStaticExport = process.env.STATIC_EXPORT === '1';

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
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    unoptimized: isStaticExport,
  },
  poweredByHeader: false,
  ...(isStaticExport
    ? {
        output: 'export' as const,
        trailingSlash: true,
      }
    : {}),
};

export default nextConfig;
