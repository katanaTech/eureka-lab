const createNextIntlPlugin = require('next-intl/plugin');
const withPWAInit = require('@ducanh2912/next-pwa').default;

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

/** PWA plugin — generates service worker + workbox runtime caching */
const withPWA = withPWAInit({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
  register: true,
  reloadOnOnline: true,
  fallbacks: {
    document: '/~offline',
  },
  workboxOptions: {
    skipWaiting: true,
    clientsClaim: true,
  },
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@eureka-lab/shared-types', '@eureka-lab/ui'],

  /* Performance optimizations */
  poweredByHeader: false,
  compress: true,

  /* Image optimization */
  images: {
    formats: ['image/avif', 'image/webp'],
  },

  /* Experimental performance features */
  experimental: {
    optimizePackageImports: ['lucide-react', '@anthropic-ai/sdk'],
  },

  /**
   * Legacy route redirects.
   * /g/world and /g/zone/* were the Phase 15 3D-world routes.
   * Phase 16 replaced them with the 2D fantasy dashboard and campaign routes.
   * Old zone URLs cannot be statically mapped to campaign slugs, so both
   * redirect to /g/dashboard and let the player navigate from there.
   */
  async redirects() {
    return [
      { source: '/g/world', destination: '/g/dashboard', permanent: true },
      { source: '/g/zone/:path*', destination: '/g/dashboard', permanent: true },
    ];
  },
};

module.exports = withPWA(withNextIntl(nextConfig));
