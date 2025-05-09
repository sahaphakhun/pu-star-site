import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  env: {
    NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME,
  },
  images: {
    domains: ['res.cloudinary.com'],
  },
};

export default nextConfig;
