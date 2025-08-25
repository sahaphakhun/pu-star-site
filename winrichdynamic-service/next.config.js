const nextConfig = {
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
}

module.exports = nextConfig
