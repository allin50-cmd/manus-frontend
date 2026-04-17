/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  experimental: {
    instrumentationHook: true,
    serverComponentsExternalPackages: ['@prisma/client', 'prisma', 'pdf-parse', 'mammoth', 'applicationinsights'],
  },
};

module.exports = nextConfig;
