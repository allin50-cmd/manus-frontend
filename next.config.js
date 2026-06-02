/** @type {import('next').NextConfig} */
const nextConfig = {
  distDir: 'dist',
  experimental: {
    serverComponentsExternalPackages: ['@prisma/client', 'prisma'],
  },
}

module.exports = nextConfig
