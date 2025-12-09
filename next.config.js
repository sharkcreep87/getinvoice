/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  images: {
    domains: [],
    unoptimized: true,
  },
  // Turbopack configuration (Next.js 16+)
  turbopack: {},
  // Mark whatsapp-web.js as server-only (Next.js 16+ uses serverExternalPackages)
  serverExternalPackages: ['whatsapp-web.js', 'puppeteer', 'qrcode-terminal'],
}

module.exports = nextConfig
