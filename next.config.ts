import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Performance optimizations for Railway deployment
  output: 'standalone',
  
  // Environment variables
  env: {
    NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME,
  },
  
  // Image optimization
  images: {
    domains: ['res.cloudinary.com', 'www.winrichdynamic.com'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'www.winrichdynamic.com',
        port: '',
        pathname: '/api/images/**',
      },
      {
        protocol: 'https',
        hostname: 'www.winrichdynamic.com',
        port: '',
        pathname: '/uploads/**',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '3000',
        pathname: '/api/images/**',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '3000',
        pathname: '/uploads/**',
      },
      {
        protocol: 'https',
        hostname: 'www.winrichdynamic.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '3000',
        pathname: '/**',
      },
    ],
    // เพิ่มการจัดการ error สำหรับ image optimization
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    unoptimized: false,
    // เพิ่ม loader สำหรับ custom image optimization
    loader: 'default',
  },
  
  // Compression
  compress: true,
  
  // Optimized performance budget - Increased limits to be more realistic
  performance: {
    maxAssetSize: 800 * 1024, // Increased from 500KB to 800KB
    maxEntrypointSize: 800 * 1024, // Increased from 500KB to 800KB
    hints: process.env.NODE_ENV === 'production' ? 'warning' : false,
  },
  
  // Experimental features for better performance
  experimental: {
    optimizeCss: true,
    optimizePackageImports: ['@/components', '@/utils', '@/lib'],
    // เพิ่ม bundle analyzer ใน production
    ...(process.env.ANALYZE === 'true' && {
      bundlePagesExternals: true,
    }),
    // Add tree shaking optimizations
    turbo: {
      rules: {
        '*.svg': {
          loaders: ['@svgr/webpack'],
          as: '*.js',
        },
      },
    },
  },
  
  // Headers for better caching and security
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
        ],
      },
      {
        source: '/articles/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=3600, s-maxage=3600', // Cache articles for 1 hour
          },
        ],
      },
      {
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable', // Cache static assets for 1 year
          },
        ],
      },
      {
        source: '/api/articles/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=300, s-maxage=300', // Cache API responses for 5 minutes
          },
        ],
      },
      // Add font caching headers
      {
        source: '/fonts/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable', // Cache fonts for 1 year
          },
        ],
      },
    ];
  },
  
  // Redirects for SEO
  async redirects() {
    return [
      // Redirect old category-based URLs to tag-based URLs
      {
        source: '/articles/category/:category',
        destination: '/articles?tags=:category',
        permanent: true,
      },
    ];
  },
  
  // Bundle analyzer (only in development)
  ...(process.env.ANALYZE === 'true' && {
    webpack: (config: any) => {
      if (process.env.NODE_ENV === 'development') {
        const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
        config.plugins.push(
          new BundleAnalyzerPlugin({
            analyzerMode: 'server',
            openAnalyzer: true,
          })
        );
      }
      return config;
    },
  }),
  
  // Webpack optimizations - Enhanced for better bundle splitting
  webpack: (config: any, { isServer }: any) => {
    // Optimize bundle size
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
      
      // Enhanced code splitting และ tree shaking
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          chunks: 'all',
          maxSize: 244000, // 244KB chunks for better caching
          cacheGroups: {
            vendor: {
              test: /[\\/]node_modules[\\/]/,
              name: 'vendors',
              chunks: 'all',
              priority: 10,
              enforce: true,
            },
            common: {
              name: 'common',
              minChunks: 2,
              chunks: 'all',
              priority: 5,
              reuseExistingChunk: true,
            },
            // Separate large libraries
            react: {
              test: /[\\/]node_modules[\\/](react|react-dom)[\\/]/,
              name: 'react',
              chunks: 'all',
              priority: 20,
            },
            // Separate UI libraries
            ui: {
              test: /[\\/]node_modules[\\/](@heroicons|framer-motion|leaflet)[\\/]/,
              name: 'ui',
              chunks: 'all',
              priority: 15,
            },
          },
        },
        // Enable tree shaking
        usedExports: true,
        sideEffects: false,
      };
      
      // Add bundle size analyzer
      if (process.env.ANALYZE === 'true') {
        const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
        config.plugins.push(
          new BundleAnalyzerPlugin({
            analyzerMode: 'static',
            openAnalyzer: false,
            reportFilename: 'bundle-analysis.html',
          })
        );
      }
    }
    
    // Add source maps in development
    if (process.env.NODE_ENV === 'development') {
      config.devtool = 'eval-source-map';
    }
    
    return config;
  },
  
  // TypeScript configuration
  typescript: {
    ignoreBuildErrors: false,
  },
  
  // ESLint configuration
  eslint: {
    ignoreDuringBuilds: false,
  },
  
  // Power pack features for Railway
  poweredByHeader: false,
  reactStrictMode: true,
  swcMinify: true,
  
  // Additional performance optimizations
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  
  // Optimize CSS
  cssMinifier: 'lightningcss',
};

export default nextConfig;
