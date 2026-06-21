const path = require('path')

/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['postgres'],
  },
  webpack: (config) => {
    // Hard-wire the "@/*" path alias to the project root so module
    // resolution never depends on Vercel reading tsconfig "paths"/"baseUrl".
    config.resolve.alias['@'] = path.resolve(__dirname)
    return config
  },
}

module.exports = nextConfig
