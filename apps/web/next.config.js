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
    /*
     * Disable SWC minification of the SERVER bundle. On next@14.2.35 the server
     * minifier miscompiles one of our modules into `TypeError: e[o] is not a
     * function`, which crashes RSC rendering of several pages during the static
     * prerender pass of `next build` (and would 500 the same pages when
     * server-rendered at runtime). Client bundles are still minified.
     * Revisit on the next Next.js upgrade — the upstream SWC bug may be fixed.
     */
    serverMinification: false,
  },

  async redirects() {
    return [
      // All Phase 16 game-mode routes collapse to the dashboard.
      { source: '/g/:path*', destination: '/dashboard', permanent: true },
      // Phase 16 mobile mirror routes also collapse to dashboard (responsive UI now).
      { source: '/m/:path*', destination: '/dashboard', permanent: true },
    ];
  },
};

module.exports = withPWA(withNextIntl(nextConfig));
