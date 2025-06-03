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
  images: {
    domains: ['res.cloudinary.com'],
  },
  // เปิด gzip/brotli compression เพื่อลด payload
  compress: true,
  env: {
    DEESMSX_API_KEY: process.env.DEESMSX_API_KEY,
    DEESMSX_SECRET_KEY: process.env.DEESMSX_SECRET_KEY,
    DEESMSX_SENDER_NAME: process.env.DEESMSX_SENDER_NAME,
    NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME,
    NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET: process.env.CLOUDINARY_UPLOAD_PRESET,
  },
};

module.exports = nextConfig; 