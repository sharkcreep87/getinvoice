/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  images: {
    domains: [],
    unoptimized: true,
  },
}

module.exports = nextConfig
