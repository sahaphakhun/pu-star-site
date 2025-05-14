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
  env: {
    DEESMSX_API_KEY: process.env.DEESMSX_API_KEY,
    DEESMSX_SECRET_KEY: process.env.DEESMSX_SECRET_KEY,
    DEESMSX_SENDER_NAME: process.env.DEESMSX_SENDER_NAME,
  },
}

module.exports = nextConfig; 