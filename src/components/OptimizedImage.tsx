'use client';

import Image from 'next/image';
import { useState, useEffect } from 'react';
import { 
  getOptimizedImageUrl, 
  generateResponsiveSrcSet, 
  generateSizesAttribute,
  DEFAULT_IMAGE_CONFIGS 
} from '@/utils/imageOptimization';

interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  priority?: boolean;
  quality?: number;
  sizes?: string;
  fill?: boolean;
  objectFit?: 'contain' | 'cover' | 'fill' | 'none' | 'scale-down';
  loading?: 'lazy' | 'eager';
  placeholder?: 'blur' | 'empty';
  blurDataURL?: string;
}

export default function OptimizedImage({
  src,
  alt,
  width,
  height,
  className = '',
  priority = false,
  quality = 80,
  sizes,
  fill = false,
  objectFit = 'cover',
  loading = 'lazy',
  placeholder = 'blur',
  blurDataURL
}: OptimizedImageProps) {
  const [imageError, setImageError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Generate blur placeholder if not provided
  const defaultBlurDataURL = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R//2Q==';

  useEffect(() => {
    setIsLoading(true);
    setImageError(false);
  }, [src]);

  const handleLoad = () => {
    setIsLoading(false);
  };

  const handleError = () => {
    setImageError(true);
    setIsLoading(false);
  };

  // Fallback image for errors
  if (imageError) {
    return (
      <div 
        className={`bg-gray-200 flex items-center justify-center ${className}`}
        style={{ width, height }}
      >
        <div className="text-center text-gray-500 p-4">
          <svg className="w-8 h-8 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span className="text-sm">ไม่สามารถโหลดรูปภาพได้</span>
        </div>
      </div>
    );
  }

  const imageProps = {
    src,
    alt,
    className: `transition-opacity duration-300 ${isLoading ? 'opacity-0' : 'opacity-100'} ${className}`,
    onLoad: handleLoad,
    onError: handleError,
    priority,
    quality,
    placeholder: placeholder as any,
    blurDataURL: blurDataURL || defaultBlurDataURL,
    sizes: sizes || generateSizesAttribute(),
    style: objectFit ? { objectFit } : undefined,
    // เพิ่มการจัดการ error สำหรับ Next.js Image
    unoptimized: src.includes('/api/images/') // ไม่ใช้ optimization สำหรับ API images
  };

  if (fill) {
    return (
      <div className="relative overflow-hidden">
        <Image
          {...imageProps}
          fill
        />
        {isLoading && (
          <div className="absolute inset-0 bg-gray-200 animate-pulse flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="relative">
      <Image
        {...imageProps}
        width={width || 800}
        height={height || 600}
      />
      {isLoading && (
        <div 
          className="absolute inset-0 bg-gray-200 animate-pulse flex items-center justify-center"
          style={{ width, height }}
        >
          <div className="w-8 h-8 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
        </div>
      )}
    </div>
  );
}

// Article Image Component with specific optimizations
export function ArticleImage({ 
  src, 
  alt, 
  caption,
  width = '100%',
  className = ''
}: {
  src: string;
  alt: string;
  caption?: string;
  width?: string;
  className?: string;
}) {
  const getImageConfig = () => {
    switch (width) {
      case '25%':
        return DEFAULT_IMAGE_CONFIGS.thumbnail;
      case '50%':
        return DEFAULT_IMAGE_CONFIGS.medium;
      case '75%':
        return DEFAULT_IMAGE_CONFIGS.large;
      default:
        return DEFAULT_IMAGE_CONFIGS.large;
    }
  };

  const config = getImageConfig();

  return (
    <figure className={`my-6 ${className}`} style={{ width: width === 'auto' ? 'auto' : width }}>
      <OptimizedImage
        src={src}
        alt={alt}
        width={config.width}
        height={config.height}
        quality={config.quality}
        className="rounded-lg shadow-sm"
        sizes={
          width === '25%' ? '(max-width: 768px) 50vw, 25vw' :
          width === '50%' ? '(max-width: 768px) 100vw, 50vw' :
          width === '75%' ? '(max-width: 768px) 100vw, 75vw' :
          '(max-width: 768px) 100vw, 100vw'
        }
      />
      {caption && (
        <figcaption className="text-center text-gray-600 text-sm mt-2 italic">
          {caption}
        </figcaption>
      )}
    </figure>
  );
}

// Hero Image Component
export function HeroImage({ 
  src, 
  alt, 
  className = '' 
}: {
  src: string;
  alt: string;
  className?: string;
}) {
  return (
    <OptimizedImage
      src={src}
      alt={alt}
      width={1920}
      height={1080}
      priority={true}
      quality={90}
      className={`w-full h-auto ${className}`}
      sizes="100vw"
    />
  );
}

// Thumbnail Image Component
export function ThumbnailImage({ 
  src, 
  alt, 
  size = 'medium',
  className = '' 
}: {
  src: string;
  alt: string;
  size?: 'small' | 'medium' | 'large';
  className?: string;
}) {
  const configs = {
    small: { width: 150, height: 150 },
    medium: { width: 300, height: 200 },
    large: { width: 400, height: 300 }
  };

  const config = configs[size];

  return (
    <OptimizedImage
      src={src}
      alt={alt}
      width={config.width}
      height={config.height}
      quality={75}
      className={`rounded-lg ${className}`}
      sizes={`${config.width}px`}
    />
  );
}