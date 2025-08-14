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
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        pathname: '/**',
      },
    ],
  },
  // เปิด gzip/brotli compression เพื่อลด payload
  compress: true,
  env: {
    // Database
    MONGODB_URI: process.env.MONGODB_URI,
    MONGO_URL: process.env.MONGO_URL,
    DATABASE_URL: process.env.DATABASE_URL,
    MONGODB_URL: process.env.MONGODB_URL,
    
    // JWT & Auth
    JWT_SECRET: process.env.JWT_SECRET,
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
    
    // SMS & Other Services
    DEESMSX_API_KEY: process.env.DEESMSX_API_KEY,
    DEESMSX_SECRET_KEY: process.env.DEESMSX_SECRET_KEY,
    DEESMSX_SENDER_NAME: process.env.DEESMSX_SENDER_NAME,
    
    // Cloudinary
    NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME,
    NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET: process.env.CLOUDINARY_UPLOAD_PRESET,
  },
};

module.exports = nextConfig; 