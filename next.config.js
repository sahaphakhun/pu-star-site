/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // ESLint errors won't fail the build in production
    ignoreDuringBuilds: true,
  },
  typescript: {
    // TypeScript errors won't fail the build in production
    ignoreBuildErrors: true,
  },
}

module.exports = nextConfig; 