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
};

module.exports = withPWA(withNextIntl(nextConfig));
