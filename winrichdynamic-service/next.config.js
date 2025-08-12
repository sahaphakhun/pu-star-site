const nextConfig = {
  images: {
    domains: ['localhost', 'res.cloudinary.com'],
  },
  env: {
    NEXT_TELEMETRY_DISABLED: process.env.NEXT_TELEMETRY_DISABLED,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
}

module.exports = nextConfig
