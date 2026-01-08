const path = require('path');

const nextConfig = {
  // Fix workspace root detection
  outputFileTracingRoot: path.resolve(__dirname),
  experimental: {
    // Force Next.js to use this directory as root
  },
  images: {
    domains: ['localhost', 'res.cloudinary.com'],
  },
  env: {
    NEXT_TELEMETRY_DISABLED: process.env.NEXT_TELEMETRY_DISABLED,
    // SMS Configuration (DeeSMSx)
    DEESMSX_API_KEY: process.env.DEESMSX_API_KEY,
    DEESMSX_SECRET_KEY: process.env.DEESMSX_SECRET_KEY,
    DEESMSX_SENDER_NAME: process.env.DEESMSX_SENDER_NAME,
    // Cloudinary (expose to client like main project)
    NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME,
    NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET: process.env.CLOUDINARY_UPLOAD_PRESET,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Enable standalone output for Docker builds
  output: 'standalone',
  // Configure TypeScript build info to avoid mounting issues
  typescript: {
    // Don't build the project during build time
    ignoreBuildErrors: true,
    // Use a custom build info file path to avoid mounting issues
    tsconfigPath: './tsconfig.json',
  },
  // Configure webpack to handle build info properly
  webpack: (config, { isServer }) => {
    // Force module resolution to use this project's src folder
    config.resolve.alias['@'] = path.resolve(__dirname, 'src');

    if (isServer) {
      // Ensure TypeScript build info is handled properly
      config.watchOptions = {
        ...config.watchOptions,
        ignored: ['**/tsconfig.tsbuildinfo'],
      };
    }
    return config;
  },
}

module.exports = nextConfig
