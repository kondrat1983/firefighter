/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  basePath: '/firefighter',
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
}

module.exports = nextConfig
