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
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
}

module.exports = nextConfig
