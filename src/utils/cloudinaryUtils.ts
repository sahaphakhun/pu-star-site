/**
 * Cloudinary utility functions for image optimization
 */

export interface CloudinaryConfig {
  width?: number;
  height?: number;
  quality?: number;
  format?: 'webp' | 'jpeg' | 'png' | 'auto';
  crop?: 'fill' | 'scale' | 'fit' | 'thumb' | 'pad';
  gravity?: 'auto' | 'center' | 'north' | 'south' | 'east' | 'west' | 'north_east' | 'north_west' | 'south_east' | 'south_west';
  radius?: number;
  effect?: string;
}

/**
 * Check if URL is a Cloudinary URL
 */
export function isCloudinaryUrl(url: string): boolean {
  return url.includes('res.cloudinary.com');
}

/**
 * Extract Cloudinary transformation parameters from URL
 */
export function extractCloudinaryTransformations(url: string): string {
  try {
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split('/');
    const uploadIndex = pathParts.findIndex(part => part === 'upload');
    
    if (uploadIndex !== -1 && uploadIndex > 0) {
      return pathParts[uploadIndex - 1];
    }
    
    return '';
  } catch (error) {
    console.error('Error extracting Cloudinary transformations:', error);
    return '';
  }
}

/**
 * Build Cloudinary transformation string
 */
export function buildCloudinaryTransformations(config: CloudinaryConfig): string {
  const transformations: string[] = [];
  
  if (config.crop) {
    transformations.push(`c_${config.crop}`);
  }
  
  if (config.width) {
    transformations.push(`w_${config.width}`);
  }
  
  if (config.height) {
    transformations.push(`h_${config.height}`);
  }
  
  if (config.quality) {
    transformations.push(`q_${config.quality}`);
  }
  
  if (config.format) {
    transformations.push(`f_${config.format}`);
  }
  
  if (config.gravity) {
    transformations.push(`g_${config.gravity}`);
  }
  
  if (config.radius) {
    transformations.push(`r_${config.radius}`);
  }
  
  if (config.effect) {
    transformations.push(`e_${config.effect}`);
  }
  
  return transformations.join(',');
}

/**
 * Optimize Cloudinary URL with transformations
 */
export function optimizeCloudinaryUrl(url: string, config: CloudinaryConfig): string {
  try {
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split('/');
    const uploadIndex = pathParts.findIndex(part => part === 'upload');
    
    if (uploadIndex === -1) {
      return url;
    }
    
    const transformations = buildCloudinaryTransformations(config);
    
    if (transformations) {
      // Insert transformations before 'upload'
      pathParts.splice(uploadIndex, 0, transformations);
      urlObj.pathname = pathParts.join('/');
    }
    
    return urlObj.toString();
  } catch (error) {
    console.error('Error optimizing Cloudinary URL:', error);
    return url;
  }
}

/**
 * Generate responsive Cloudinary URLs for different screen sizes
 */
export function generateCloudinaryResponsiveUrls(
  baseUrl: string, 
  sizes: Array<{ width: number; quality?: number; format?: string }>
): string {
  return sizes
    .map(size => {
      const config: CloudinaryConfig = {
        width: size.width,
        quality: size.quality || 80,
        format: size.format || 'auto',
        crop: 'fill'
      };
      return `${optimizeCloudinaryUrl(baseUrl, config)} ${size.width}w`;
    })
    .join(', ');
}

/**
 * Get Cloudinary public ID from URL
 */
export function getCloudinaryPublicId(url: string): string | null {
  try {
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split('/');
    const uploadIndex = pathParts.findIndex(part => part === 'upload');
    
    if (uploadIndex !== -1 && uploadIndex < pathParts.length - 1) {
      // Get everything after 'upload' and before the file extension
      const afterUpload = pathParts.slice(uploadIndex + 1).join('/');
      return afterUpload.replace(/\.[^/.]+$/, ''); // Remove file extension
    }
    
    return null;
  } catch (error) {
    console.error('Error getting Cloudinary public ID:', error);
    return null;
  }
}

/**
 * Generate Cloudinary URL from public ID
 */
export function generateCloudinaryUrl(
  publicId: string, 
  config: CloudinaryConfig = {},
  cloudName?: string
): string {
  const cloudNameValue = cloudName || process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  
  if (!cloudNameValue) {
    console.error('Cloudinary cloud name not configured');
    return '';
  }
  
  const transformations = buildCloudinaryTransformations(config);
  const transformationPath = transformations ? `/${transformations}` : '';
  
  return `https://res.cloudinary.com/${cloudNameValue}/image/upload${transformationPath}/${publicId}`;
}

/**
 * Predefined Cloudinary configurations
 */
export const CLOUDINARY_CONFIGS = {
  thumbnail: { width: 300, height: 200, quality: 75, crop: 'fill' as const },
  medium: { width: 600, height: 400, quality: 80, crop: 'fill' as const },
  large: { width: 1200, height: 800, quality: 85, crop: 'fill' as const },
  hero: { width: 1920, height: 1080, quality: 90, crop: 'fill' as const },
  square: { width: 400, height: 400, quality: 80, crop: 'fill' as const },
  auto: { quality: 80, format: 'auto' as const }
};
