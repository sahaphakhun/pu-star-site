const nextConfig = {
  serverExternalPackages: ['mongoose'],
  images: {
    domains: ['localhost', 'res.cloudinary.com'],
  },
  env: {
    MONGODB_URI: process.env.MONGODB_URI,
    LINE_CHANNEL_SECRET: process.env.LINE_CHANNEL_SECRET,
    LINE_CHANNEL_ACCESS_TOKEN: process.env.LINE_CHANNEL_ACCESS_TOKEN,
    WMS_API_URL: process.env.WMS_API_URL,
    WMS_API_KEY: process.env.WMS_API_KEY,
  },
}

module.exports = nextConfig
