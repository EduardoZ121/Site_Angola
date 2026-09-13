import type { NextConfig } from 'next';
import { SECURITY_HEADERS } from './lib/security-headers';

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
  async headers() {
    return [
      {
        source: '/:path*',
        headers: SECURITY_HEADERS.map(({ key, value }) => ({ key, value })),
      },
    ];
  },
  ...(isStaticExport
    ? {
        output: 'export' as const,
        trailingSlash: true,
      }
    : {}),
};

export default nextConfig;
