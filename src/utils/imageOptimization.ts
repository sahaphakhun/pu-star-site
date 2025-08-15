// Image optimization utilities for Railway deployment

export interface ImageOptimizationConfig {
  quality: number;
  width?: number;
  height?: number;
  format?: 'webp' | 'jpeg' | 'png';
}

export const DEFAULT_IMAGE_CONFIGS = {
  thumbnail: { quality: 75, width: 300, height: 200, format: 'webp' as const },
  medium: { quality: 80, width: 600, height: 400, format: 'webp' as const },
  large: { quality: 85, width: 1200, height: 800, format: 'webp' as const },
  hero: { quality: 90, width: 1920, height: 1080, format: 'webp' as const }
};

/**
 * Generate optimized image URL for Railway deployment
 * Uses Next.js built-in image optimization
 */
export function getOptimizedImageUrl(
  src: string, 
  config: ImageOptimizationConfig = DEFAULT_IMAGE_CONFIGS.medium
): string {
  if (!src) return '';
  
  // If it's already an external URL, return as is
  if (src.startsWith('http')) {
    return src;
  }
  
  // For local uploads, use our API route
  if (src.includes('/uploads/images/') || src.includes('/api/images/')) {
    // Extract filename from URL
    const filename = src.split('/').pop();
    if (filename) {
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || '';
      return `${baseUrl}/api/images/${filename}`;
    }
  }
  
  // For Railway deployment, use Next.js image optimization
  const params = new URLSearchParams();
  
  if (config.width) params.set('w', config.width.toString());
  if (config.height) params.set('h', config.height.toString());
  if (config.quality) params.set('q', config.quality.toString());
  if (config.format) params.set('f', config.format);
  
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || '';
  return `${baseUrl}/_next/image?url=${encodeURIComponent(src)}&${params.toString()}`;
}

/**
 * Generate responsive image srcSet for different screen sizes
 */
export function generateResponsiveSrcSet(src: string): string {
  if (!src) return '';
  
  const sizes = [
    { width: 640, quality: 75 },
    { width: 768, quality: 80 },
    { width: 1024, quality: 85 },
    { width: 1280, quality: 85 },
    { width: 1920, quality: 90 }
  ];
  
  return sizes
    .map(size => `${getOptimizedImageUrl(src, { ...size, format: 'webp' })} ${size.width}w`)
    .join(', ');
}

/**
 * Generate sizes attribute for responsive images
 */
export function generateSizesAttribute(): string {
  return '(max-width: 640px) 100vw, (max-width: 768px) 100vw, (max-width: 1024px) 100vw, 1200px';
}

/**
 * Check if image is optimizable (not external)
 */
export function isOptimizable(src: string): boolean {
  if (!src) return false;
  return !src.startsWith('http') || src.includes(process.env.NEXT_PUBLIC_BASE_URL || '');
}

/**
 * Get image dimensions from URL (for Railway static files)
 */
export async function getImageDimensions(src: string): Promise<{ width: number; height: number } | null> {
  try {
    if (typeof window === 'undefined') return null;
    
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        resolve({ width: img.naturalWidth, height: img.naturalHeight });
      };
      img.onerror = () => {
        resolve(null);
      };
      img.src = src;
    });
  } catch (error) {
    console.error('Error getting image dimensions:', error);
    return null;
  }
}

/**
 * Preload critical images for better performance
 */
export function preloadImage(src: string, priority: 'high' | 'low' = 'low'): void {
  if (typeof window === 'undefined' || !src) return;
  
  const link = document.createElement('link');
  link.rel = 'preload';
  link.as = 'image';
  link.href = getOptimizedImageUrl(src, DEFAULT_IMAGE_CONFIGS.medium);
  link.fetchPriority = priority;
  
  document.head.appendChild(link);
}

/**
 * Lazy load images with Intersection Observer
 */
export class LazyImageLoader {
  private observer: IntersectionObserver | null = null;
  
  constructor() {
    if (typeof window === 'undefined') return;
    
    this.observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const img = entry.target as HTMLImageElement;
            const src = img.dataset.src;
            
            if (src) {
              img.src = src;
              img.classList.remove('lazy');
              img.classList.add('loaded');
              this.observer?.unobserve(img);
            }
          }
        });
      },
      {
        rootMargin: '50px 0px',
        threshold: 0.01
      }
    );
  }
  
  observe(element: HTMLImageElement): void {
    this.observer?.observe(element);
  }
  
  disconnect(): void {
    this.observer?.disconnect();
  }
}

// Export singleton instance
export const lazyImageLoader = new LazyImageLoader();

/**
 * Image compression for uploads (client-side)
 */
export function compressImage(
  file: File, 
  maxWidth: number = 1920, 
  maxHeight: number = 1080, 
  quality: number = 0.8
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      // Calculate new dimensions
      let { width, height } = img;
      
      if (width > height) {
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width = (width * maxHeight) / height;
          height = maxHeight;
        }
      }
      
      canvas.width = width;
      canvas.height = height;
      
      // Draw and compress
      ctx?.drawImage(img, 0, 0, width, height);
      
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Canvas to blob conversion failed'));
          }
        },
        'image/webp',
        quality
      );
    };
    
    img.onerror = () => reject(new Error('Image load failed'));
    img.src = URL.createObjectURL(file);
  });
}